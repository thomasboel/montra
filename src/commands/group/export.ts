import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function _export(): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  console.log(JSON.stringify(serviceGroups));
}

export default new Command('export')
  .description('Export a group for sharing')
  .action(withErrorHandler(_export));
