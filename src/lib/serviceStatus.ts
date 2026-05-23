import path from 'node:path';

import { execute } from './exec.js';
import { listWindows } from './tmux/tmux.js';
import { getActiveContainers } from './docker/docker.js';
import store, { Service, ServiceType } from '../utils/store.js';
import { parallelMap } from '../utils/parallelMap.js';

export type ServiceStatus = 'RUNNING' | 'STOPPED' | 'SESSION_EXISTS';

export const statusMap: Record<ServiceStatus, string> = {
  RUNNING: '🟢 Running',
  STOPPED: '🔴 Stopped',
  SESSION_EXISTS: '🟡 Session Exists',
};

const STATUS_CONCURRENCY = 8;

export async function getServiceStatus(
  serviceName: string,
): Promise<ServiceStatus> {
  const map = await getServiceStatusBulk([serviceName]);
  const status = map.get(serviceName);
  if (status === undefined) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }
  return status;
}

/** Bulk variant. Fans out the tmux/docker reads once, then resolves each
 *  service against the cached data with bounded parallelism. */
export async function getServiceStatusBulk(
  serviceNames: string[],
): Promise<Map<string, ServiceStatus>> {
  const allServices = store.get('services');
  const services = serviceNames.map((name) => {
    const found = allServices.find((s) => [s.name, s.alias].includes(name));
    if (!found) {
      throw new Error(`Service with the name ${name} does not exist`);
    }
    return { input: name, service: found };
  });

  const caches = await buildSessionCaches(services.map((s) => s.service));

  const entries = await parallelMap(
    services,
    STATUS_CONCURRENCY,
    async ({ input, service }) => {
      const status = await resolveStatus(service, caches);
      return [input, status] as const;
    },
  );

  return new Map(entries);
}

type SessionCaches = {
  tmuxWindowsByType: Map<ServiceType, string[]>;
  dockerContainers: string[];
};

async function buildSessionCaches(
  services: Service[],
): Promise<SessionCaches> {
  const portless = services.filter((s) => !s.port);

  const [tmuxWindowsByType, dockerContainers] = await Promise.all([
    fetchTmuxWindowsByType(portless),
    fetchDockerContainers(portless),
  ]);

  return { tmuxWindowsByType, dockerContainers };
}

async function fetchTmuxWindowsByType(
  services: Service[],
): Promise<Map<ServiceType, string[]>> {
  const tmuxTypes = new Set(
    services.filter((s) => s.runtime === 'tmux').map((s) => s.type),
  );
  const windowsByType = new Map<ServiceType, string[]>();

  await Promise.all(
    [...tmuxTypes].map(async (type) => {
      const result = await listWindows(type);
      windowsByType.set(type, result.success ? result.data : []);
    }),
  );

  return windowsByType;
}

async function fetchDockerContainers(services: Service[]): Promise<string[]> {
  const needsDocker = services.some((s) => s.runtime === 'docker');
  if (!needsDocker) return [];
  return getActiveContainers().catch(() => []);
}

async function resolveStatus(
  service: Service,
  caches: SessionCaches,
): Promise<ServiceStatus> {
  if (service.port) {
    if (await isPortReachable(service)) return 'RUNNING';
    return 'STOPPED';
  }

  if (sessionExistsForService(service, caches)) return 'SESSION_EXISTS';
  return 'STOPPED';
}

async function isPortReachable(service: Service): Promise<boolean> {
  if (await passesLivenessProbe(service)) return true;

  const result = await execute(`lsof -n -i :${service.port} | grep LISTEN`);
  return result.success && !!result.stdout;
}

function sessionExistsForService(
  service: Service,
  caches: SessionCaches,
): boolean {
  switch (service.runtime) {
    case 'tmux': {
      const windows = caches.tmuxWindowsByType.get(service.type) ?? [];
      return windows.includes(service.name);
    }
    case 'docker':
      return caches.dockerContainers.some((c) => c.includes(service.name));
    default:
      throw new Error(
        `Invalid runtime "${service.runtime}" on service ${service.name}`,
      );
  }
}

async function passesLivenessProbe(service: Service): Promise<boolean> {
  const repoPath = path.join(
    store.get('repositoryDirectory'),
    service.repository,
  );

  const probePathResult = await execute(
    `yq 'select(.kind == "Deployment") | .spec.template.spec.containers[0].livenessProbe.httpGet.path' ${repoPath}/deployment/production/${service.repository}.yaml`,
  );

  if (!probePathResult.success) return false;

  const probeUrl = `http://localhost:${service.port}${probePathResult.stdout.trim()}`;
  const result = await execute(
    `curl --fail --silent --output /dev/null --max-time 10 ${probeUrl}`,
  );

  return result.success;
}
