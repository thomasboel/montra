import { Command } from '@commander-js/extra-typings';
import path from 'node:path';
import ora from 'ora';

import { getServiceStatus } from './status.js';
import { newSession, newWindow, sessionExists } from '../../lib/tmux/tmux.js';
import { dockerComposeUp } from '../../lib/docker/dockerCompose.js';
import { findComposeServiceByImage } from '../../utils/findComposeServiceByImage.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store, { Service } from '../../utils/store.js';
import { getPulledImages } from '../../lib/docker/docker.js';

export async function start(serviceName: string): Promise<void> {
  if (serviceName === 'all') {
    for (const service of store.get('services')) {
      await start(service.name);
    }
    return;
  }

  if ((await getServiceStatus(serviceName)) === 'RUNNING') {
    return;
  }

  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  if (service.type === 'docker_compose_service') {
    return await startDockerComposeService(service);
  }

  if (service.type === 'lambda' && !service.port) {
    throw new Error(
      `Starting lambdas running in localstack is not implemented yet`,
    );
  }

  const runtime = store.get('runtime');

  switch (runtime) {
    case 'tmux':
      await startTmuxService(service);
      break;
    case 'docker':
      await startDockerService(service);
      break;
    default:
      throw new Error(`Invalid runtime "${runtime}" specified in config`);
  }

  store.set('startedServices', [
    ...store.get('startedServices'),
    { service, startedAt: Date.now() },
  ]);
}

async function startDockerComposeService(service: Service) {
  const result = await dockerComposeUp({
    filePath: path.join(
      store.get('repositoryDirectory'),
      service.repository,
      'docker-compose.yml',
    ),
    serviceNames: [service.name],
  });

  if (result.success) {
    console.log(`✅ ${service.name} started`);
    return;
  }

  throw new Error(
    `Failed to start service ${service.name}: ${result.error.error.message}`,
  );
}

async function startTmuxService(service: Service): Promise<void> {
  if (!(await sessionExists(service.type))) {
    const result = await newSession({
      sessionName: service.type,
      windowName: service.alias ?? service.name,
      command: service.runCommand,
      entrypoint: path.join(
        store.get('repositoryDirectory'),
        service.repository,
      ),
    });

    if (result.success) {
      console.log(`✅ ${service.name} started`);
      return;
    }

    throw new Error(
      `Failed to start service ${service.name}: ${result.error.error.message}`,
    );
  }

  const result = await newWindow({
    sessionName: service.type,
    windowName: service.alias ?? service.name,
    entrypoint: path.join(
      store.get('repositoryDirectory'),
      service.repository,
    ),
    command: service.runCommand,
  });

  if (result.success) {
    console.log(`✅ ${service.name} started`);
    return;
  }

  console.error(
    `⚠️ Failed to start service ${service.name}: ${result.error.error.message}`,
  );
}

async function startDockerService(service: Service): Promise<void> {
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

  const pulledImages = await getPulledImages();

  const spinner = ora(
    pulledImages.includes(composeService.image)
      ? `Starting ${service.name}...`
      : `Pulling missing image ${composeService.image} and starting ${service.name}...`,
  ).start();

  const result = await dockerComposeUp({
    filePath: dockerComposeFilePath,
    serviceNames: [composeService.serviceName],
  });

  if (!result.success) {
    spinner.clear();
    throw new Error(
      `Failed to start service ${service.name}: ${result.error.error.message}`,
    );
  }

  spinner.succeed(`✅ ${service.name} started`);
}

export default new Command('start')
  .description('Start a service')
  .argument('<service>')
  .action(withErrorHandler(start));
