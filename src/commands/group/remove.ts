import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function remove(
  serviceGroupName: string,
  serviceNames: string[],
): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];
  const services = store.get('services') ?? [];

  const serviceGroup = serviceGroups.find(
    (serviceGroup) => serviceGroup.name === serviceGroupName,
  );

  if (!serviceGroup) {
    throw new Error(
      `Service group with the name "${serviceGroupName}" does not exist`,
    );
  }

  const validServiceNames = services.map((s) => s.name);
  const unknownServices = serviceNames.filter(
    (name) => !validServiceNames.includes(name),
  );
  unknownServices.forEach((name) => {
    console.warn(`⚠️ Skipped "${name}" since it is not a known service`);
  });

  const knownServices = serviceNames.filter((name) =>
    validServiceNames.includes(name),
  );

  const alreadyRemoved = knownServices.filter(
    (name) => !serviceGroup.services.includes(name),
  );
  alreadyRemoved.forEach((name) => {
    console.log(`ℹ️ Skipped "${name}" as it is not in "${serviceGroupName}"`);
  });

  const toRemove = knownServices.filter((name) =>
    serviceGroup.services.includes(name),
  );

  if (toRemove.length === 0) {
    return;
  }

  const updatedServiceGroups = serviceGroups.map((group) =>
    group.name === serviceGroupName
      ? {
          ...group,
          services: group.services.filter(
            (service) => !toRemove.includes(service),
          ),
        }
      : group,
  );

  store.set('serviceGroups', updatedServiceGroups);

  toRemove.forEach((name) =>
    console.log(`✅ Removed "${name}" from "${serviceGroupName}"`),
  );
}

export default new Command('remove')
  .description('Remove a service from a service group')
  .argument('<group>', 'Name of the group to remove services from')
  .argument('<services...>', 'One or more service names to remove')
  .action(withErrorHandler(remove));
