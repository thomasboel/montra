import { Command } from '@commander-js/extra-typings';

import { start as startServices } from '../service/start.js';
import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function start(serviceGroupName: string): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  const serviceGroup = serviceGroups.find(
    (group) => group.name === serviceGroupName,
  );

  if (!serviceGroup) {
    throw new Error(
      `Service group with the name "${serviceGroupName}" does not exist`,
    );
  }

  await startServices(serviceGroup.services);
}

export default new Command('start')
  .description('Start all the services in the group')
  .argument('<group>')
  .action(withErrorHandler(start));
