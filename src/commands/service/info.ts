import { Command } from '@commander-js/extra-typings';
import path from 'node:path';
import chalk from 'chalk';

import { execute } from '../../lib/exec.js';
import { getServiceStatus, statusMap } from './status.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store from '../../utils/store.js';
import ora from 'ora';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

type ServiceInfo = {
  service: string;
  alias?: string;
  type: string;
  status?: string;
  repository: string;
  branch: string;
  version: string;
  nodeVersion: string;
  runCommand?: string;
  expectedSecondsToStart?: number;
  port?: number;
};

export async function info(
  serviceName: string,
  { json, status }: { json: boolean; status: boolean },
): Promise<void> {
  if (serviceName === 'all') {
    await printInfoOnAllServices({ json, status });
    return;
  }

  const serviceInfo = await getServiceInfo({ serviceName, status });

  if (json) {
    console.log(JSON.stringify(serviceInfo, null, 2));
    return;
  }

  printServiceInfo(serviceInfo);
}

async function getServiceInfo({
  serviceName,
  status,
}: {
  serviceName: string;
  status: boolean;
}): Promise<ServiceInfo> {
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

  const nodeVersionResult = await execute('cat .nvmrc', { cwd: repoPath });

  const nodeVersion = nodeVersionResult.success
    ? nodeVersionResult.stdout.trim()
    : '⚠️ Could not determine the node version';

  return {
    service: service.name,
    alias: service.alias,
    type: service.type,
    status: status ? statusMap[await getServiceStatus(serviceName)] : undefined,
    repository: repoPath,
    branch: currentWorkingBranch,
    version: projectVersion,
    nodeVersion,
    runCommand: service.runCommand,
    expectedSecondsToStart: service.expectedSecondsToStart,
    port: service.port,
  };
}

function printServiceInfo(serviceInfo: ServiceInfo): void {
  prettyPrintKeyValue('📦 Service', serviceInfo.service);
  prettyPrintKeyValue('🔖 Alias', serviceInfo.alias);
  prettyPrintKeyValue('ℹ️ Type', serviceInfo.type);
  prettyPrintKeyValue(`⚙️ Status`, serviceInfo.status);
  prettyPrintKeyValue('📁 Repository', chalk.dim(serviceInfo.repository));
  prettyPrintKeyValue('🌿 Branch', chalk.green(serviceInfo.branch));
  prettyPrintKeyValue('🧾 Version', chalk.magenta(serviceInfo.version));
  prettyPrintKeyValue(
    '🧾 Node Version',
    chalk.magenta(serviceInfo.nodeVersion),
  );
  prettyPrintKeyValue('🚀 Start Command', chalk.cyan(serviceInfo.runCommand));
  prettyPrintKeyValue(
    '⏱️ Expected Startup Time',
    chalk.blue(serviceInfo.expectedSecondsToStart) + ' seconds',
  );
  prettyPrintKeyValue(
    '🔌 Exposed Port',
    chalk.blue(serviceInfo.port?.toString()),
  );
}

async function printInfoOnAllServices({
  json,
  status,
}: {
  json: boolean;
  status: boolean;
}) {
  if (json) {
    const spinner = ora('Fetching info on all services...').start();

    const servicesInfo = await Promise.all(
      store
        .get('services')
        .map((service) =>
          getServiceInfo({ serviceName: service.name, status }),
        ),
    );

    spinner.clear();

    console.log(JSON.stringify(servicesInfo, null, 2));
    process.exit(0);
  }

  for (const service of store.get('services')) {
    const serviceInfo = await getServiceInfo({
      serviceName: service.name,
      status,
    });
    printServiceInfo(serviceInfo);
    console.log(
      '________________________________________________________________________________',
    );
  }
  process.exit(0);
}

export default new Command('info')
  .description('Print info about a service')
  .argument('<service>')
  .option(
    '-j, --json',
    'print service info as stringified json to allow jq piping',
  )
  .option('-s, --status', 'will include the service status')
  .action(withErrorHandler(info));
