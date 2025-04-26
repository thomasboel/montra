import { Command } from '@commander-js/extra-typings';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';

import { execute } from '../../lib/exec.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store from '../../utils/store.js';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

type PackageInfo = {
  package: string;
  repository: string;
  branch: string;
  version: string;
};

export async function info(
  packageName: string,
  { json }: { json: boolean },
): Promise<void> {
  if (packageName === 'all') {
    await printInfoOnAllPackages({ json });
    return;
  }

  const packageInfo = await getPackageInfo({ packageName });

  if (json) {
    console.log(JSON.stringify(packageInfo, null, 2));
    return;
  }

  printPackageInfo(packageInfo);
}

async function getPackageInfo({
  packageName,
}: {
  packageName: string;
}): Promise<PackageInfo> {
  const _package = store.get('packages').find((p) => p.name === packageName);

  if (!_package) {
    throw new Error(`Package with the name ${packageName} does not exist`);
  }

  const repoPath = path.join(
    store.get('repositoryDirectory'),
    _package.repository,
  );

  const currentWorkingBranchResult = await execute(
    'git rev-parse --abbrev-ref HEAD',
    { cwd: repoPath },
  );

  const currentWorkingBranch = currentWorkingBranchResult.success
    ? currentWorkingBranchResult.stdout.trim()
    : '⚠️ Could not determine the current working branch';

  const projectVersionResult = await execute(
    "cat package.json | grep '\"version\"' | cut -c 15- | rev | cut -c 3- | rev",
    { cwd: repoPath },
  );

  const projectVersion = projectVersionResult.success
    ? projectVersionResult.stdout.trim()
    : '⚠️ Could not determine the project version';

  return {
    package: _package.name,
    repository: repoPath,
    branch: currentWorkingBranch,
    version: projectVersion,
  };
}

function printPackageInfo(packageInfo: PackageInfo): void {
  prettyPrintKeyValue('📦 Package', packageInfo.package);
  prettyPrintKeyValue('📁 Repository', chalk.dim(packageInfo.repository));
  prettyPrintKeyValue('🌿 Branch', chalk.green(packageInfo.branch));
  prettyPrintKeyValue('🧾 Version', chalk.magenta(packageInfo.version));
}

async function printInfoOnAllPackages({ json }: { json: boolean }) {
  if (json) {
    const spinner = ora('Fetching info on all packages...').start();

    const packagesInfo = await Promise.all(
      store.get('packages').map((p) => getPackageInfo({ packageName: p.name })),
    );

    spinner.clear();

    console.log(JSON.stringify(packagesInfo, null, 2));
    process.exit(0);
  }

  for (const _package of store.get('packages')) {
    const packageInfo = await getPackageInfo({
      packageName: _package.name,
    });
    printPackageInfo(packageInfo);
    console.log(
      '________________________________________________________________________________',
    );
  }
  process.exit(0);
}

export default new Command('info')
  .description('Print info about a package')
  .argument('<package>')
  .option(
    '-j, --json',
    'print service info as stringified json to allow jq piping',
  )
  .action(withErrorHandler(info));
