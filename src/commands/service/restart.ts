import { Command } from '@commander-js/extra-typings';

import { stop } from './stop.js';
import { start } from './start.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store from '../../utils/store.js';

export async function restart(serviceName: string): Promise<void> {
  if (serviceName === 'all') {
    for (const service of store.get('services')) {
      await restart(service.name);
    }
    return;
  }

  await stop(serviceName);
  await start(serviceName);
}

export default new Command('restart')
  .description('Restart a service')
  .argument('<service>')
  .action(withErrorHandler(restart));
