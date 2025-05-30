import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function list(): Promise<void> {
  const services = store.get('services') ?? [];

  for (const service of services) {
    console.log(service.name);
  }
}

export default new Command('list')
  .alias('ls')
  .description('List all services')
  .action(withErrorHandler(list));
