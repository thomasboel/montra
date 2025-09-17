import { Command } from '@commander-js/extra-typings';

import store, { RUNTIMES, SERVICE_TYPES } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import inquirer from 'inquirer';
import { getServiceStatus } from './status.js';

export async function modify(serviceName: string): Promise<void> {
  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  const serviceStatus = await getServiceStatus(serviceName);

  if (serviceStatus !== 'STOPPED') {
    throw new Error(`Please stop the service before modifying it`);
  }

  const updatedService = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Service name',
      default: serviceName,
    },
    {
      type: 'input',
      name: 'alias',
      message: 'Service alias (optional)',
      default: service.alias,
    },
    {
      type: 'select',
      name: 'type',
      message: 'Service type',
      default: service.type,
      choices: SERVICE_TYPES,
    },
    {
      type: 'input',
      name: 'repository',
      message: 'Repository directory name',
      default: service.repository,
    },
    {
      type: 'input',
      name: 'runCommand',
      message: 'Service run command',
      default: service.runCommand,
    },
    {
      type: 'number',
      name: 'port',
      message: 'Service port',
      default: service.port,
    },
    {
      type: 'number',
      name: 'expectedSecondsToStart',
      message: 'Expected seconds for service to start accepting requests',
      default: service.expectedSecondsToStart,
    },
    {
      type: 'select',
      name: 'runtime',
      message: 'Service runtime',
      default: service.runtime,
      choices: RUNTIMES,
    },
  ]);

  const updatedServices = store.get('services').map((service) => {
    if (service.name === serviceName) {
      return updatedService;
    }
    return service;
  });

  store.set('services', updatedServices);

  console.log(`✅ The ${serviceName} service was updated successfully`);
}

export default new Command('modify')
  .description('Modify the service configuration')
  .argument('<service>')
  .action(withErrorHandler(modify));
