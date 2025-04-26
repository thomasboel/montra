import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function list(): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  for (const serviceGroup of serviceGroups) {
    console.log(serviceGroup.name);
  }
}

export default new Command('list')
  .alias('ls')
  .description('List groups')
  .action(withErrorHandler(list));
