import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import ora from 'ora';
import { execute } from '../../lib/exec.js';
import { notify } from '../../utils/notify.js';
import path from 'node:path';

export async function subscribe(packageName: string): Promise<void> {
  const _package = store.get('packages').find((p) => p.name === packageName);

  if (!_package) {
    throw new Error(`Service with the name ${packageName} does not exist`);
  }

  const repoPath = path.join(
    store.get('repositoryDirectory'),
    _package.repository,
  );

  const projectNameResult = await execute('cat package.json | jq -r .name', {
    cwd: repoPath,
  });

  if (!projectNameResult.success) {
    throw new Error(
      `Failed to fetch project name: ${JSON.stringify(projectNameResult.error, null, 2)}`,
    );
  }

  const projectName = projectNameResult.stdout.trim();

  const spinner = ora(
    `Subscribing to tag update for package: ${projectName}...`,
  ).start();

  const initialTagResult = await getLatestTagForPackage(projectName);

  if (!initialTagResult.success) {
    spinner.clear();
    throw new Error(
      `Failed to fetch latest tag: ${JSON.stringify(initialTagResult.error, null, 2)}`,
    );
  }

  let tryCount = 1;

  spinner.start(
    `Latest tag: ${initialTagResult.stdout.trim()}. This command will exit when a new tag is created. Try count: ${tryCount}...`,
  );

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const tagResult = await getLatestTagForPackage(projectName);

    if (!tagResult.success) {
      spinner.clear();
      throw new Error(
        `Failed to fetch latest tag: ${JSON.stringify(tagResult.error, null, 2)}`,
      );
    }

    const initialTag = initialTagResult.stdout.trim();
    const latestTag = tagResult.stdout.trim();

    if (latestTag !== initialTag) {
      spinner.succeed(`New tag created: ${latestTag}`);
      await notify(`New tag created: ${latestTag} for ${projectName}`);
      break;
    }

    tryCount++;
    spinner.start(
      `Latest tag: ${initialTagResult.stdout.trim()}. This command will exit when a new tag is created. Try count: ${tryCount}...`,
    );
  }
}

async function getLatestTagForPackage(_package: string) {
  return await execute(
    `curl -s -H "Authorization: Bearer $NPM_TOKEN" https://registry.npmjs.org/${_package} | jq '.["dist-tags"].latest'`,
  );
}

export default new Command('subscribe')
  .description(
    'Subscribe to a package to get notified when a new tag is created',
  )
  .argument('<package>')
  .action(withErrorHandler(subscribe));
