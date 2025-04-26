import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function remove(packageName: string): Promise<void> {
  const packages = store.get('packages') ?? [];

  if (!packages.some((s) => s.name === packageName)) {
    throw new Error(`Package with the name ${packageName} does not exist`);
  }

  store.set('packages', [...packages.filter((s) => s.name !== packageName)]);

  console.log(`✅ Removed package "${packageName}"`);
}

export default new Command('remove')
  .description('Remove a package')
  .argument('<package>')
  .action(withErrorHandler(remove));
