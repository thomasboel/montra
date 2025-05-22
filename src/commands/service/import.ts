import { Command } from '@commander-js/extra-typings';

import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { add } from './add.js';
import { remove } from './remove.js';

export async function _import(
  servicesImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const services = store.get('services') ?? [];

  const servicesToAdd: Service[] = JSON.parse(servicesImport);

  for (const serviceToAdd of servicesToAdd) {
    const serviceAlreadyExists = services.some(
      (service) => service.name === serviceToAdd.name,
    );

    if (serviceAlreadyExists && !force) {
      console.warn(
        `ℹ️ Skipping import of service with the name "${serviceToAdd.name}" since it already exists. Use --force to force an overwrite of the existing service.`,
      );
      continue;
    }

    if (serviceAlreadyExists && force) {
      await remove(serviceToAdd.name);
    }

    await add({
      name: serviceToAdd.name,
      type: serviceToAdd.type,
      cmd: serviceToAdd.runCommand,
      alias: serviceToAdd.alias,
      port: serviceToAdd.port?.toString(),
      expectedSecondsToStart: serviceToAdd.expectedSecondsToStart?.toString(),
      repository: serviceToAdd.repository,
    });
  }
}

export default new Command('import')
  .description('Import services')
  .argument('<services>', 'stringified JSON of services')
  .option('-f, --force', 'force overwrite existing services')
  .action(withErrorHandler(_import));
