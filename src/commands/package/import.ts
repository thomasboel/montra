import { Command } from '@commander-js/extra-typings';

import store, { Package } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { add } from './add.js';
import { remove } from './remove.js';
import inquirer from 'inquirer';

type PackageImport = Package & { cliVersion: string };

export async function _import(
  packagesImport: string,
  { force }: { force: boolean },
): Promise<void> {
  const packageImports: PackageImport[] = JSON.parse(packagesImport);

  console.clear();

  const { choices }: { choices: string[] } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'choices',
      message: 'Select the services you wish to import',
      choices: packageImports.map((p) => 'name: ' + p.name),
      pageSize: 40,
      loop: false,
    },
  ]);

  console.clear();

  const packagesToImport = choices
    .map((choice) =>
      packageImports.find((_package) =>
        choice.startsWith(`name: ${_package.name}`),
      ),
    )
    .filter((_package) => _package !== undefined);

  const existingPackages = store.get('packages') ?? [];

  for (const packageToImport of packagesToImport) {
    const packageAlreadyExists = existingPackages.some(
      (_package) => _package.name === packageToImport.name,
    );

    if (packageAlreadyExists && !force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `A package with the name "${packageToImport.name}" already exists, do you wish to overwrite the existing package?`,
        },
      ]);

      if (confirmed) {
        await remove(packageToImport.name);
      } else {
        continue;
      }
    }

    if (packageAlreadyExists && force) {
      await remove(packageToImport.name);
    }

    await add({
      name: packageToImport.name,
      repository: packageToImport.repository,
    });
  }

  console.log(`✅ Import done`);
}

export default new Command('import')
  .description('Import packages')
  .argument('<packages>', 'stringified JSON of packages')
  .option('-f, --force', 'force overwrite existing packages')
  .action(withErrorHandler(_import));
