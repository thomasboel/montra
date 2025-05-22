import { Command } from '@commander-js/extra-typings';

import store, { Package } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { add } from './add.js';
import { remove } from './remove.js';

export async function _import(
  packagesImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const packages = store.get('packages') ?? [];

  const packagesToAdd: Package[] = JSON.parse(packagesImport);

  for (const packageToAdd of packagesToAdd) {
    const packageAlreadyExists = packages.some(
      (_package) => _package.name === packageToAdd.name,
    );

    if (packageAlreadyExists && !force) {
      console.warn(
        `ℹ️ Skipping import of package with the name "${packageToAdd.name}" since it already exists. Use --force to force an overwrite of the existing package.`,
      );
      continue;
    }

    if (packageAlreadyExists && force) {
      await remove(packageToAdd.name);
    }

    await add({
      name: packageToAdd.name,
      repository: packageToAdd.repository,
    });
  }
}

export default new Command('import')
  .description('Import packages')
  .argument('<packages>', 'stringified JSON of packages')
  .option('-f, --force', 'force overwrite existing packages')
  .action(withErrorHandler(_import));
