import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function add(
  serviceGroupName: string,
  serviceNames: string[],
): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];
  const services = store.get('services');

  const serviceGroup = serviceGroups.find(
    (group) => group.name === serviceGroupName,
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
  unknownServices.forEach((service) => {
    console.warn(`⚠️ Skipped "${service}" since it is not a known service`);
  });

  const knownServices = serviceNames.filter((name) =>
    validServiceNames.includes(name),
  );

  const alreadyAdded = knownServices.filter((name) =>
    serviceGroup.services.includes(name),
  );
  alreadyAdded.forEach((service) => {
    console.log(
      `ℹ️ Skipped "${service}" as it is already in "${serviceGroupName}"`,
    );
  });

  const toAdd = knownServices.filter(
    (name) => !serviceGroup.services.includes(name),
  );

  if (toAdd.length === 0) {
    return;
  }

  const updatedServiceGroups = serviceGroups.map((group) =>
    group.name === serviceGroupName
      ? {
          ...group,
          services: [...group.services, ...toAdd],
        }
      : group,
  );

  store.set('serviceGroups', updatedServiceGroups);

  toAdd.forEach((name) =>
    console.log(`✅ Added "${name}" to "${serviceGroupName}"`),
  );
}

export default new Command('add')
  .description('Add a service to a service group')
  .argument('<group>', 'Name of the group to add services to')
  .argument('<services...>', 'One or more service names to add')
  .action(withErrorHandler(add));
