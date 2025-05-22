import { Command } from '@commander-js/extra-typings';

import store, { ServiceGroup } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { create } from './create.js';
import { add } from './add.js';
import { _delete } from './delete.js';

export async function _import(
  serviceGroupsImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  const serviceGroupsToCreate: ServiceGroup[] = JSON.parse(serviceGroupsImport);

  for (const serviceGroupToCreate of serviceGroupsToCreate) {
    const groupAlreadyExists = serviceGroups.some(
      (serviceGroup) => serviceGroup.name === serviceGroupToCreate.name,
    );

    if (groupAlreadyExists && !force) {
      console.warn(
        `ℹ️ Skipping import of service group with the name "${serviceGroupToCreate.name}" since it already exists. Use --force to force an overwrite of the existing service groups.`,
      );
      continue;
    }

    if (groupAlreadyExists && force) {
      await _delete(serviceGroupToCreate.name, { force });
    }

    await create(serviceGroupToCreate.name);

    await add(serviceGroupToCreate.name, serviceGroupToCreate.services);
  }
}

export default new Command('import')
  .description('Import a group')
  .argument('<serviceGroups>', 'stringified JSON of service groups')
  .option(
    '-f, --force',
    'force overwrite existing services if service group already exists with a provided name',
  )
  .action(withErrorHandler(_import));
