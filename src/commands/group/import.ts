import { Command } from '@commander-js/extra-typings';

import store, { ServiceGroup } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { create } from './create.js';
import { add } from './add.js';
import { _delete } from './delete.js';
import inquirer from 'inquirer';
import { padLabel } from '../../utils/prettyPrintKeyValue.js';
import { remove } from '../service/remove.js';

type ServiceGroupImport = ServiceGroup & { cliVersion: string };

export async function _import(
  serviceGroupsImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const serviceGroupsImports: ServiceGroupImport[] =
    JSON.parse(serviceGroupsImport);

  console.clear();

  const { choices }: { choices: string[] } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'choices',
      message: 'Select the service groups you wish to import',
      choices: serviceGroupsImports.map(
        (sg) =>
          `${padLabel('name: ' + sg.name, 20)} services: ${sg.services.join(', ')}`,
      ),
      pageSize: 40,
      loop: false,
    },
  ]);

  console.clear();

  const serviceGroupsToImport = choices
    .map((choice) =>
      serviceGroupsImports.find((serviceGroup) =>
        choice.startsWith(`name: ${serviceGroup.name}`),
      ),
    )
    .filter((serviceGroup) => serviceGroup !== undefined);

  const existingServiceGroups = store.get('serviceGroups') ?? [];

  for (const serviceGroupToImport of serviceGroupsToImport) {
    const groupAlreadyExists = existingServiceGroups.some(
      (serviceGroup) => serviceGroup.name === serviceGroupToImport.name,
    );

    if (groupAlreadyExists && !force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `A service group with the name "${serviceGroupToImport.name}" already exists, do you wish to overwrite the existing service group?`,
        },
      ]);

      if (confirmed) {
        await _delete(serviceGroupToImport.name, { force: true });
      } else {
        continue;
      }
    }

    if (groupAlreadyExists && force) {
      await _delete(serviceGroupToImport.name, { force });
    }

    await create(serviceGroupToImport.name);

    await add(serviceGroupToImport.name, serviceGroupToImport.services);
  }

  console.log(`✅ Import done`);
}

export default new Command('import')
  .description('Import a group')
  .argument('<serviceGroups>', 'stringified JSON of service groups')
  .option(
    '-f, --force',
    'force overwrite existing services if service group already exists with a provided name',
  )
  .action(withErrorHandler(_import));
