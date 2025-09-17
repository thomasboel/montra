import { Command } from '@commander-js/extra-typings';
import path from 'node:path';

import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { killWindow } from '../../lib/tmux/tmux.js';
import { dockerComposeStop } from '../../lib/docker/dockerCompose.js';
import { stopContainerByPort } from '../../lib/docker/docker.js';
import { findComposeServiceByImage } from '../../utils/findComposeServiceByImage.js';

export async function stop(serviceNames: string[]): Promise<void> {
  if (serviceNames[0] === 'all') {
    await stop(store.get('services').map((s) => s.name));
    return;
  }

  for (const serviceName of serviceNames) {
    await stopService(serviceName);
  }
}

async function stopService(serviceName: string): Promise<void> {
  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  if (service.type === 'docker_compose_service') {
    return await stopDockerComposeService(service);
  }

  if (service.type === 'lambda') {
    if (service.port) {
      await stopContainerByPort(service.port);
    } else {
      throw new Error(
        `Stopping lambdas running in localstack is not implemented yet`,
      );
    }
  }

  switch (service.runtime) {
    case 'tmux':
      return await stopTmuxService(service);
    case 'docker':
      return await stopDockerService(service);
    default:
      throw new Error(
        `Unknown runtime "${service.runtime}" configured for service ${serviceName}`,
      );
  }
}

async function stopDockerComposeService(service: Service) {
  const result = await dockerComposeStop({
    filePath: path.join(
      store.get('repositoryDirectory'),
      service.repository,
      'docker-compose.yml',
    ),
    serviceNames: [service.name],
  });

  if (result.success) {
    console.log(`✅ ${service.name} stopped`);
    return;
  }

  throw new Error(
    `Failed to stop service ${service.name}: ${result.error.error.message}`,
  );
}

async function stopTmuxService(service: Service): Promise<void> {
  const result = await killWindow({
    sessionName: service.type,
    windowName: service.alias ?? service.name,
  });

  if (result.success) {
    console.log(`✅ ${service.name} stopped`);
    return;
  }

  if (result.error.type === 'internal') {
    console.log(`ℹ️ Nothing changed, ${service.name} was not running`);
    return;
  }

  console.error(
    `⚠️ Failed to stop service ${service.name}: ${result.error.error.message}`,
  );
}

async function stopDockerService(service: Service): Promise<void> {
  const dockerComposeFilePath = path.resolve(
    store.get('repositoryDirectory'),
    'coms',
    'docker-compose.yml',
  );

  const composeService = findComposeServiceByImage(
    dockerComposeFilePath,
    service.repository, // More likely to find a match with the repository name rather than the name of the service
  );

  if (!composeService) {
    console.error(
      `❌ Service ${service.name} is not setup in ${dockerComposeFilePath}, please add the service there before proceeding.`,
    );
    return;
  }

  const result = await dockerComposeStop({
    filePath: dockerComposeFilePath,
    serviceNames: [composeService.serviceName],
  });

  if (!result.success) {
    throw new Error(
      `Failed to start service ${service.name}: ${result.error.error.message}`,
    );
  }

  console.log(`✅ ${service.name} stopped`);
}

export default new Command('stop')
  .description('Stop services')
  .argument('<services...>')
  .action(withErrorHandler(stop));
