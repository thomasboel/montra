import { Command } from '@commander-js/extra-typings';
import path from 'node:path';
import chalk from 'chalk';

import { readFile, readJsonFile, stat } from '../../lib/file.js';
import { getServiceStatus, ServiceStatus, statusMap } from './status.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store, { Runtime, ServiceType } from '../../utils/store.js';
import ora from 'ora';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

export type ServiceInfo = {
  service: string;
  alias?: string;
  type: ServiceType;
  status?: ServiceStatus;
  repository: string;
  branch: string;
  version: string;
  description: string;
  nodeVersion: string;
  runCommand?: string;
  expectedSecondsToStart?: number;
  port?: number;
  runtime?: Runtime;
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

export async function getServiceInfo({
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

  const [currentWorkingBranch, packageJson, nodeVersion] = await Promise.all([
    readGitBranch(repoPath),
    readPackageJson(repoPath),
    readNvmrc(repoPath),
  ]);

  const projectVersion =
    packageJson === null
      ? '⚠️ Could not determine the project version'
      : jqRawString(packageJson.version);

  const projectDescription =
    packageJson === null
      ? '⚠️ Could not determine the project description'
      : jqRawString(packageJson.description);

  return {
    service: service.name,
    alias: service.alias,
    type: service.type,
    status: status ? await getServiceStatus(serviceName) : undefined,
    repository: repoPath,
    branch: currentWorkingBranch,
    version: projectVersion,
    description: projectDescription,
    nodeVersion,
    runCommand: service.runCommand,
    expectedSecondsToStart: service.expectedSecondsToStart,
    port: service.port,
    runtime: service.runtime,
  };
}

async function readGitBranch(repoPath: string): Promise<string> {
  const branchFallback = '⚠️ Could not determine the current working branch';

  let gitDir = path.join(repoPath, '.git');
  const statResult = await stat(gitDir);
  if (!statResult.success) return branchFallback;

  // Worktrees and submodules use a `.git` file pointing at the real gitdir.
  if (statResult.data.isFile()) {
    const pointerResult = await readFile(gitDir);
    if (!pointerResult.success) return branchFallback;
    const match = pointerResult.data.match(/^gitdir:\s*(.+)$/m);
    if (!match) return branchFallback;
    gitDir = path.resolve(repoPath, match[1].trim());
  }

  const headResult = await readFile(path.join(gitDir, 'HEAD'));
  if (!headResult.success) return branchFallback;

  const branchMatch = headResult.data.trim().match(/^ref: refs\/heads\/(.+)$/);
  return branchMatch ? branchMatch[1] : 'HEAD';
}

async function readPackageJson(
  repoPath: string,
): Promise<Record<string, unknown> | null> {
  const result = await readJsonFile<Record<string, unknown>>(
    path.join(repoPath, 'package.json'),
  );
  return result.success ? result.data : null;
}

async function readNvmrc(repoPath: string): Promise<string> {
  const result = await readFile(path.join(repoPath, '.nvmrc'));
  return result.success
    ? result.data.trim()
    : '⚠️ Could not determine the node version';
}

// Mirrors `jq -r`: null/undefined become the string "null", everything else is stringified.
function jqRawString(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  return String(value);
}

function printServiceInfo(serviceInfo: ServiceInfo): void {
  prettyPrintKeyValue('📦 Service', serviceInfo.service);
  prettyPrintKeyValue('🔖 Alias', serviceInfo.alias);
  prettyPrintKeyValue('ℹ️ Type', serviceInfo.type);
  prettyPrintKeyValue(
    `⚙️ Status`,
    serviceInfo.status && statusMap[serviceInfo.status],
  );
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
  prettyPrintKeyValue('⚡️ Runtime', chalk.yellow(serviceInfo.runtime));
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

    const sortedServicesInfo = servicesInfo.sort((a, b) =>
      a.service.localeCompare(b.service),
    );

    spinner.clear();

    console.log(JSON.stringify(sortedServicesInfo, null, 2));
    process.exit(0);
  }

  const sortedServices = store
    .get('services')
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const service of sortedServices) {
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
