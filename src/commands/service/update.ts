import { Command } from '@commander-js/extra-typings';
import path from 'node:path';
import ora from 'ora';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { execute } from '../../lib/exec.js';

export async function update(
  serviceName: string,
  { master, forceMaster }: { master: boolean; forceMaster: boolean },
): Promise<void> {
  if (serviceName === 'all') {
    for (const service of store.get('services')) {
      await update(service.name, { master, forceMaster });
    }
    return;
  }

  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  const repoPath = path.join(
    store.get('repositoryDirectory'),
    service.repository,
  );

  const shouldCheckoutMaster = master || forceMaster;

  const spinner = ora(
    shouldCheckoutMaster
      ? `📥 Shelving changes and checking out master branch for ${serviceName}...`
      : `Updating ${serviceName}...`,
  ).start();

  if (shouldCheckoutMaster) {
    await shelveAndCheckoutMaster(repoPath, forceMaster);
  }

  spinner.text = `Updating ${serviceName}...`;

  const gitPullResult = await execute('git pull', { cwd: repoPath });

  if (!gitPullResult.success) {
    spinner.clear();
    throw new Error(
      `Failed to pull from the repository: ${gitPullResult.error.error.message}`,
    );
  }

  if (gitPullResult.stdout.includes('Already up to date.')) {
    spinner.succeed(`✅ ${serviceName} is already up to date.`);
    return;
  }

  const usePnpm = service.runCommand?.includes('pnpm') ?? false;

  const command = `export NVM_DIR="$HOME/.nvm"; \
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; \
  nvm install; \
  nvm use; \
  ${usePnpm ? 'pnpm' : 'npm'} install`;

  const fullCommand = `zsh -c "${command.replace(/"/g, '\\"')}"`;

  const result = await execute(fullCommand, {
    cwd: repoPath,
  });

  if (!result.success) {
    spinner.clear();
    throw new Error(
      `Failed to update the service. Error: ${result.error.error.message}`,
    );
  }

  spinner.succeed(`✅ Updated ${serviceName} successfully.`);
}

async function shelveAndCheckoutMaster(
  repoPath: string,
  forceMaster: boolean,
): Promise<void> {
  const stashResult = await execute('git stash --include-untracked', {
    cwd: repoPath,
  });

  if (!stashResult.success) {
    throw new Error(
      `Failed to stash changes: ${stashResult.error.error.message}`,
    );
  }

  const checkoutResult = await execute('git checkout master', {
    cwd: repoPath,
  });

  if (!checkoutResult.success && forceMaster) {
    const forcedCheckout = await execute('git checkout -f master', {
      cwd: repoPath,
    });

    if (!forcedCheckout.success) {
      throw new Error(
        `Force checkout failed: ${forcedCheckout.error.error.message}`,
      );
    }

    await execute('git clean -fd', { cwd: repoPath });
  } else if (!checkoutResult.success) {
    throw new Error(
      `Failed to checkout master: ${checkoutResult.error.error.message}`,
    );
  }
}

export default new Command('update')
  .description(
    'Update a service to the latest version of the current working branch',
  )
  .option(
    '-m, --master',
    'Checks out the master branch before pulling. Any changes will be stashed.',
  )
  .option(
    '-f, --force-master',
    'Force checks out the master branch before pulling. Any changes will be stashed (also runs `git clean -fd`)',
  )
  .argument('<service>')
  .action(withErrorHandler(update));
