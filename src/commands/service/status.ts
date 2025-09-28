import { Command } from '@commander-js/extra-typings';
import path from 'node:path';

import { execute } from '../../lib/exec.js';
import { listWindows } from '../../lib/tmux/tmux.js';
import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { getActiveContainers } from '../../lib/docker/docker.js';
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
  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

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

  if (await checkServiceSessionExists(service)) {
    return 'SESSION_EXISTS';
  }

  return 'STOPPED';
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

async function checkServiceSessionExists(service: Service): Promise<boolean> {
  const runtime = store.get('runtime');

  switch (runtime) {
    case 'tmux':
      const windowsResult = await listWindows(service.type);

      if (!windowsResult.success) {
        return false;
      }

      return windowsResult.data.includes(service.name);
    case 'docker':
      const containers = await getActiveContainers();

      return containers.some((container) => container.includes(service.name));
    default:
      throw new Error(`Invalid runtime "${runtime}" specified in config`);
  }
}

export default new Command('status')
  .description('Check status of the service')
  .option(
    '-w, --watch [value]',
    'print the service status with the intention of it being watched (for example, `watch -n 10 montra service status -w 3 all`)',
  )
  .argument('<service>', 'use "all" to show status for all services')
  .action(withErrorHandler(status));
