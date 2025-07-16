import { Command } from '@commander-js/extra-typings';
import path from 'node:path';

import { execute } from '../../lib/exec.js';
import { listWindows } from '../../lib/tmux/tmux.js';
import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { getActiveContainers } from '../../lib/docker/docker.js';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

type ServiceStatus = 'RUNNING' | 'STOPPED' | 'SESSION_EXISTS';

export const statusMap: Record<ServiceStatus, string> = {
  RUNNING: '🟢 Running',
  STOPPED: '🔴 Stopped',
  SESSION_EXISTS: '🟡 Session Exists',
};

export async function status(serviceName: string): Promise<void> {
  if (serviceName === 'all') {
    const sortedServices = store
      .get('services')
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const service of sortedServices) {
      await status(service.name);
    }
    return;
  }

  const serviceStatus = await getServiceStatus(serviceName);

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
      `curl --fail --silent --output /dev/null http://localhost:${service.port}${livenessProbeUrlFromDeploymentFileResult.stdout.trim()}`,
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
  .argument('<service>', 'use "all" to show status for all services')
  .action(withErrorHandler(status));
