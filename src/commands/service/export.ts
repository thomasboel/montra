import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function _export(): Promise<void> {
  const services = store.get('services') ?? [];

  console.log(JSON.stringify(services));
}

export default new Command('export')
  .description('Export services for sharing')
  .action(withErrorHandler(_export));
