import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function remove(serviceName: string): Promise<void> {
  const services = store.get('services') ?? [];

  if (!services.some((s) => s.name === serviceName)) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  store.set('services', [...services.filter((s) => s.name !== serviceName)]);

  console.log(`✅ Removed service "${serviceName}"`);
}

export default new Command('remove')
  .description('Remove a service')
  .argument('<service>')
  .action(withErrorHandler(remove));
