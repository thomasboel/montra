import { Command } from '@commander-js/extra-typings';

import store, {
  Service,
  SERVICE_TYPES,
  ServiceType,
  Runtime,
} from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function add({
  name,
  alias,
  type,
  repository = name,
  port,
  cmd,
  expectedSecondsToStart,
  runtime,
}: {
  name: string;
  type: ServiceType;
  repository?: string;
  alias?: string;
  port?: string;
  cmd?: string;
  expectedSecondsToStart?: string;
  runtime?: Runtime;
}): Promise<void> {
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
    port: Number(port),
    runCommand: cmd,
    expectedSecondsToStart: Number(expectedSecondsToStart),
    runtime: runtime ?? store.get('runtime'),
  };

  store.set('services', [...services, newService]);

  console.log(`✅ Added new service "${name}"`);
}

const description = `
  Add a new service (* = required)

Example:
  mon service add --name my-service --type backend_service --cmd "npm run start" --port 9090 --expected-seconds-to-start 8
  `.trim();

export default new Command('add')
  .description(description)
  .requiredOption('-n, --name <name>', '* Service name')
  .requiredOption(
    '-t, --type <type>',
    `* Service type (${SERVICE_TYPES.join(', ')})`,
  )
  .option(
    '-r, --repository <repository>',
    'Repository name (defaults to service name)',
  )
  .option('-a, --alias <alias>', 'Service alias')
  .option('-c, --cmd <command>', 'Service run command (e.g "npm run start")')
  .option('-p, --port <port>', 'Service port')
  .option(
    '-e, --expected-seconds-to-start <seconds>',
    "Expected seconds for service to start (expose it's port)",
  )
  .option('-R, --runtime <runtime>', 'Service runtime, e.g. "docker" or "tmux" (defaults to globally configured runtime)')
  .action(withErrorHandler(add));
