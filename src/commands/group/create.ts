import { Command } from '@commander-js/extra-typings';

import store, { ServiceGroup } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function create(name: string): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  if (serviceGroups.some((serviceGroup) => serviceGroup.name === name)) {
    throw new Error(`A service group named "${name}" already exists.`);
  }

  const newServiceGroup: ServiceGroup = {
    name,
    services: [],
  };

  store.set('serviceGroups', [...serviceGroups, newServiceGroup]);

  console.log(`✅ Added new service group "${name}"`);
}

export default new Command('create')
  .description('Create a new service group')
  .argument('<group>')
  .action(withErrorHandler(create));
