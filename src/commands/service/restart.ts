import { Command } from '@commander-js/extra-typings';

import { stop } from './stop.js';
import { start } from './start.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store from '../../utils/store.js';

export async function restart(serviceNames: string[]): Promise<void> {
  if (serviceNames[0] === 'all') {
    await restart(store.get('services').map((s) => s.name));
    return;
  }

  await stop(serviceNames);
  await start(serviceNames);
}

export default new Command('restart')
  .description('Restart services')
  .argument('<services...>')
  .action(withErrorHandler(restart));
