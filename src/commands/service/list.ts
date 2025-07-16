import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function list(): Promise<void> {
  const services = store.get('services') ?? [];

  const sortedServices = services.sort((a, b) => a.name.localeCompare(b.name));

  for (const service of sortedServices) {
    console.log(service.name);
  }
}

export default new Command('list')
  .alias('ls')
  .description('List all services')
  .action(withErrorHandler(list));
