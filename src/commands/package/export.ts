import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { version } from '../../utils/pkgVersion.js';

export async function _export(): Promise<void> {
  const packages = store.get('packages') ?? [];

  const packagesWithVersion = packages.map((_package) => ({
    ..._package,
    cliVersion: version,
  }));

  console.log(JSON.stringify(packagesWithVersion));
}

export default new Command('export')
  .description('Export packages for sharing')
  .action(withErrorHandler(_export));
