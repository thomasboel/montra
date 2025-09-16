import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { version } from '../../utils/pkgVersion.js';

export async function _export(): Promise<void> {
  const serviceGroups = store.get('serviceGroups') ?? [];

  const serviceGroupsWithVersion = serviceGroups.map((serviceGroup) => ({
    ...serviceGroup,
    cliVersion: version,
  }));

  console.log(JSON.stringify(serviceGroupsWithVersion));
}

export default new Command('export')
  .description('Export a group for sharing')
  .action(withErrorHandler(_export));
