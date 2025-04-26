import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function list(): Promise<void> {
  const packages = store.get('packages') ?? [];

  for (const _package of packages) {
    console.log(_package.name);
  }
}

export default new Command('list')
  .alias('ls')
  .description('List all packages')
  .action(withErrorHandler(list));
