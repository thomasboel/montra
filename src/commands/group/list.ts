import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function list(): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  const sortedServiceGroups = serviceGroups.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const serviceGroup of sortedServiceGroups) {
    console.log(serviceGroup.name);
  }
}

export default new Command('list')
  .alias('ls')
  .description('List groups')
  .action(withErrorHandler(list));
