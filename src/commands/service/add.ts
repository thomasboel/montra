import { Command } from '@commander-js/extra-typings';

import store, {
  Service,
  SERVICE_TYPES,
  ServiceType,
  Runtime,
  RUNTIMES,
} from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import inquirer from 'inquirer';

export async function add(): Promise<void> {
  const services = store.get('services') ?? [];

  const service: {
    name: string;
    alias: string;
    type: ServiceType;
    repository: string;
    runCommand: string;
    port: number;
    expectedSecondsToStart: number;
    runtime: Runtime;
  } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Service name',
      validate: (name) => services.some((s) => s.name === name) ? `A service named "${name}" already exists.` : true,
    },
    {
      type: 'input',
      name: 'alias',
      message: 'Service alias (optional)',
    },
    {
      type: 'select',
      name: 'type',
      message: 'Service type',
      choices: SERVICE_TYPES,
    },
    {
      type: 'input',
      name: 'repository',
      message: 'Repository directory name (defaults to service name)',
    },
    {
      type: 'input',
      name: 'runCommand',
      message: 'Service run command (e.g. "npm start")',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Service port',
    },
    {
      type: 'number',
      name: 'expectedSecondsToStart',
      message: 'Expected seconds for service to start accepting requests',
    },
    {
      type: 'select',
      name: 'runtime',
      message: 'Service runtime',
      choices: RUNTIMES,
      default: store.get('runtime'),
    },
  ]);

  await addService({
    name: service.name,
    ...(service.alias ? { alias: service.alias } : {}),
    type: service.type,
    ...(service.repository ? { repository: service.repository } : {}),
    port: service.port,
    runCommand: service.runCommand,
    expectedSecondsToStart: service.expectedSecondsToStart,
    runtime: service.runtime,
  });
}

export async function addService({
  name,
  alias,
  type,
  repository = name,
  port,
  runCommand,
  expectedSecondsToStart,
  runtime,
}: {
  name: string;
  type: ServiceType;
  repository?: string;
  alias?: string;
  port?: number;
  runCommand?: string;
  expectedSecondsToStart: number;
  runtime?: Runtime;
}) {
  const services = store.get('services') ?? [];

  if (services.some((s) => s.name === name)) {
    throw new Error(`A service named "${name}" already exists.`);
  }

  if (!SERVICE_TYPES.includes(type)) {
    throw new Error(
      `Invalid service type "${type}". Must be one of: ${SERVICE_TYPES.join(', ')}`,
    );
  }

  const newService: Service = {
    name,
    alias,
    type,
    repository,
    port,
    runCommand,
    expectedSecondsToStart,
    runtime: runtime ?? store.get('runtime'),
  };

  store.set('services', [...services, newService]);

  console.log(`✅ Added new service "${name}"`);
}

export default new Command('add')
  .description('Add a new service')
  .action(withErrorHandler(add));
