import { Command } from '@commander-js/extra-typings';
import path from 'node:path';

import { execute } from '../../lib/exec.js';
import { listWindows } from '../../lib/tmux/tmux.js';
import store, { Service, ServiceType } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { parallelMap } from '../../utils/parallelMap.js';
import { getActiveContainers } from '../../lib/docker/docker.js';

const STATUS_CONCURRENCY = 8;
import {
  chunkArray,
  padLabel,
  printBox,
  printBoxesSideBySide,
  prettyPrintKeyValue,
} from '../../utils/prettyPrintKeyValue.js';

export type ServiceStatus = 'RUNNING' | 'STOPPED' | 'SESSION_EXISTS';

export const statusMap: Record<ServiceStatus, string> = {
  RUNNING: '🟢 Running',
  STOPPED: '🔴 Stopped',
  SESSION_EXISTS: '🟡 Session Exists',
};

export async function status(
  serviceName: string,
  { watch }: { watch: number },
): Promise<void> {
  if (serviceName === 'all') {
    const sortedServices = store
      .get('services')
      .sort((a, b) => a.name.localeCompare(b.name));

    if (watch) {
      await printWatchAllStatus(sortedServices, watch);
      return;
    }

    for (const service of sortedServices) {
      await status(service.name, { watch });
    }
    return;
  }

  const serviceStatus = await getServiceStatus(serviceName);

  if (watch) {
    printBox(`${padLabel(serviceName, 20)}\n${statusMap[serviceStatus]}`);
    return;
  }

  prettyPrintKeyValue(serviceName, statusMap[serviceStatus], 40);
}

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

/**
 * Resolves status for many services at once. Pre-fetches the runtime-level
 * data (tmux windows per unique service type, docker container list) so
 * each service doesn't re-query — collapses N tmux/docker calls down to
 * one per unique type / one total.
 */
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
  const runtime = store.get('runtime');
  const portless = services.filter((s) => !s.port);

  const tmuxWindowsByType = new Map<ServiceType, string[]>();
  let dockerContainers: string[] = [];

  if (portless.length === 0) {
    return { tmuxWindowsByType, dockerContainers };
  }

  if (runtime === 'tmux') {
    const uniqueTypes = [...new Set(portless.map((s) => s.type))];
    await Promise.all(
      uniqueTypes.map(async (type) => {
        const result = await listWindows(type);
        tmuxWindowsByType.set(type, result.success ? result.data : []);
      }),
    );
  } else if (runtime === 'docker') {
    dockerContainers = await getActiveContainers().catch(() => []);
  }

  return { tmuxWindowsByType, dockerContainers };
}

async function resolveStatus(
  service: Service,
  caches: SessionCaches,
): Promise<ServiceStatus> {
  if (service.port) {
    if (await checkLivenessProbe(service)) {
      return 'RUNNING';
    }

    const result = await execute(`lsof -n -i :${service.port} | grep LISTEN`);

    if (!result.success || !result.stdout) {
      return 'STOPPED';
    }

    return 'RUNNING';
  }

  if (sessionExistsForService(service, caches)) {
    return 'SESSION_EXISTS';
  }

  return 'STOPPED';
}

function sessionExistsForService(
  service: Service,
  caches: SessionCaches,
): boolean {
  const runtime = store.get('runtime');

  switch (runtime) {
    case 'tmux': {
      const windows = caches.tmuxWindowsByType.get(service.type) ?? [];
      return windows.includes(service.name);
    }
    case 'docker':
      return caches.dockerContainers.some((c) => c.includes(service.name));
    default:
      throw new Error(`Invalid runtime "${runtime}" specified in config`);
  }
}

async function printWatchAllStatus(services: Service[], watch: number) {
  const servicesWithStatus = await Promise.all(
    services.map(async (service) => ({
      ...service,
      status: await getServiceStatus(service.name),
    })),
  );

  const sortedServicesWithStatus = servicesWithStatus.sort((a, b) =>
    a.status.localeCompare(b.status),
  );

  const serviceChunks = chunkArray(sortedServicesWithStatus, Number(watch));

  for (const chunk of serviceChunks) {
    const statuses = await Promise.all(
      chunk.map((service) => getServiceStatus(service.name)),
    );
    const serviceTexts = statuses.map((status, index) => {
      return `${padLabel(chunk[index].name, 30)}\n${statusMap[status]}`;
    });
    printBoxesSideBySide(...serviceTexts);
  }
}

async function checkLivenessProbe(service: Service): Promise<boolean> {
  const repoPath = path.join(
    store.get('repositoryDirectory'),
    service.repository,
  );

  const livenessProbeUrlFromDeploymentFileResult = await execute(
    `yq 'select(.kind == "Deployment") | .spec.template.spec.containers[0].livenessProbe.httpGet.path' ${repoPath}/deployment/production/${service.repository}.yaml`,
  );

  if (livenessProbeUrlFromDeploymentFileResult.success) {
    const result = await execute(
      `curl --fail --silent --output /dev/null --max-time 10 http://localhost:${service.port}${livenessProbeUrlFromDeploymentFileResult.stdout.trim()}`,
    );

    if (result.success) {
      return true;
    }
  }

  return false;
}

export default new Command('status')
  .description('Check status of the service')
  .option(
    '-w, --watch [value]',
    'print the service status with the intention of it being watched (for example, `watch -n 10 montra service status -w 3 all`)',
  )
  .argument('<service>', 'use "all" to show status for all services')
  .action(withErrorHandler(status));
