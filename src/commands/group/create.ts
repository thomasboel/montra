import { Command } from '@commander-js/extra-typings';

import store, { ServiceGroup } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import inquirer from 'inquirer';

export async function create(name: string): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  if (serviceGroups.some((serviceGroup) => serviceGroup.name === name)) {
    throw new Error(`A service group named "${name}" already exists.`);
  }

  const services = store.get('services');

  console.clear();

  const { servicesToAdd } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'servicesToAdd',
      message: 'Choose the services you wish to include in this group',
      choices: services.map((service) => service.name),
      pageSize: 40,
      loop: false,
    },
  ]);

  console.clear();

  const newServiceGroup: ServiceGroup = {
    name,
    services: servicesToAdd,
  };

  store.set('serviceGroups', [...serviceGroups, newServiceGroup]);

  console.log(`✅ Added new service group "${name}"`);
}

export default new Command('create')
  .description('Create a new service group')
  .argument('<group>')
  .action(withErrorHandler(create));
