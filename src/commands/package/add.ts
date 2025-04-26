import { Command } from '@commander-js/extra-typings';

import store, { Package } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';

export async function add({
  name,
  repository = name,
}: {
  name: string;
  repository: string;
}): Promise<void> {
  const packages = store.get('packages') ?? [];

  if (packages.some((s) => s.name === name)) {
    throw new Error(`A package named "${name}" already exists.`);
  }

  const newPackage: Package = {
    name,
    repository,
  };

  store.set('packages', [...packages, newPackage]);

  console.log(`✅ Added new package "${name}"`);
}

const description = `
  Add a new package (* = required)

Example:
  svl package add --name workflow
  `.trim();

export default new Command('add')
  .description(description)
  .requiredOption('-n, --name <name>', '* Package name')
  .option(
    '-r, --repository <repository>',
    'Repository name (defaults to package name)',
  )
  .action(withErrorHandler(add));
