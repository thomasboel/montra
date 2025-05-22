import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function _export(): Promise<void> {
  const packages = store.get('packages') ?? [];

  console.log(JSON.stringify(packages));
}

export default new Command('export')
  .description('Export packages for sharing')
  .action(withErrorHandler(_export));
