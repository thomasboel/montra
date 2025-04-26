import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import inquirer from 'inquirer';

export async function _delete(
  name: string,
  { force }: { force: boolean },
): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  if (!serviceGroups.some((serviceGroup) => serviceGroup.name === name)) {
    throw new Error(`Service group with the name "${name}" does not exist`);
  }

  if (!force && !(await confirmGroupDeletion(name))) {
    process.exit(1);
  }

  store.set('serviceGroups', [
    ...serviceGroups.filter((serviceGroup) => serviceGroup.name !== name),
  ]);

  console.log(`✅ Removed service group "${name}"`);
}

async function confirmGroupDeletion(groupName: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure you want to delete the group "${groupName}"?`,
      default: false,
    },
  ]);

  return confirmed;
}

export default new Command('delete')
  .description('Remove a service group')
  .argument('<group>')
  .option(
    '-f, --force',
    'automatically deletes the group without prompting the user',
  )
  .action(withErrorHandler(_delete));
