import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import inquirer from 'inquirer';

export async function modify(serviceGroupName: string): Promise<void> {
  const serviceGroup = store
    .get('serviceGroups')
    .find((serviceGroup) => serviceGroup.name === serviceGroupName);

  if (!serviceGroup) {
    throw new Error(
      `Service group with the name ${serviceGroupName} does not exist`,
    );
  }

  console.clear();

  const updatedServiceGroup = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Service group name',
      default: serviceGroup.name,
    },
    {
      type: 'checkbox',
      name: 'services',
      message: 'Services',
      choices: serviceGroup.services,
      default: serviceGroup.services,
      pageSize: 40,
      loop: false,
    },
  ]);

  console.clear();

  const updatedServiceGroups = store
    .get('serviceGroups')
    .map((serviceGroup) => {
      if (serviceGroup.name === serviceGroupName) {
        return updatedServiceGroup;
      }
      return serviceGroup;
    });

  store.set('serviceGroups', updatedServiceGroups);

  console.log(`✅ The ${serviceGroupName} service group was updated successfully`);
}

export default new Command('modify')
  .description('Modify the service group configuration')
  .argument('<group>')
  .action(withErrorHandler(modify));
