import { Command } from '@commander-js/extra-typings';
import inquirer from 'inquirer';

import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { addService } from './add.js';
import { remove } from './remove.js';
import { padLabel } from '../../utils/prettyPrintKeyValue.js';

type ServiceImport = Service & { cliVersion: string };

export async function _import(
  servicesImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const serviceImports: ServiceImport[] = JSON.parse(servicesImport);

  console.clear();

  const { choices }: { choices: string[] } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'choices',
      message: 'Select the services you wish to import',
      choices: serviceImports.map(
        (s) =>
          `${padLabel('name: ' + s.name, 40)} port: ${padLabel(s.port?.toString() ?? 'N/A', 5)} - repo: ${s.repository}`,
      ),
      pageSize: 40,
      loop: false,
    },
  ]);

  console.clear();

  const servicesToImport = choices
    .map((choice) =>
      serviceImports.find((service) =>
        choice.startsWith(`name: ${service.name}`),
      ),
    )
    .filter((service) => service !== undefined);

  const existingServices = store.get('services') ?? [];

  for (const serviceToImport of servicesToImport) {
    const serviceAlreadyExists = existingServices.some(
      (service) => service.name === serviceToImport.name,
    );

    if (serviceAlreadyExists && !force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `A service with the name "${serviceToImport.name}" already exists, do you wish to overwrite the existing service?`,
        },
      ]);

      if (confirmed) {
        await remove(serviceToImport.name);
      } else {
        continue;
      }
    }

    if (serviceAlreadyExists && force) {
      await remove(serviceToImport.name);
    }

    await addService({
      name: serviceToImport.name,
      type: serviceToImport.type,
      runCommand: serviceToImport.runCommand,
      ...(serviceToImport.alias ? { alias: serviceToImport.alias } : {}),
      ...(serviceToImport.port ? { port: serviceToImport.port } : {}),
      expectedSecondsToStart: serviceToImport.expectedSecondsToStart,
      repository: serviceToImport.repository,
      runtime: serviceToImport.runtime,
    });
  }
}

export default new Command('import')
  .description('Import services')
  .argument('<services>', 'stringified JSON of services')
  .option('-f, --force', 'force overwrite existing services')
  .action(withErrorHandler(_import));
