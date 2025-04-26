import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import ora from 'ora';
import { withErrorHandler } from '../../utils/errorHandler.js';
import store from '../../utils/store.js';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

type ServiceGroupInfo = {
  serviceGroup: string;
  services: string[];
};

export async function info(
  serviceGroupName: string,
  { json }: { json: boolean },
): Promise<void> {
  if (serviceGroupName === 'all') {
    await printInfoOnAllServiceGroups({ json });
    return;
  }

  const serviceGroupInfo = await getServiceGroupInfo({ serviceGroupName });

  if (json) {
    console.log(JSON.stringify(serviceGroupInfo, null, 2));
    return;
  }

  printServiceGroupInfo(serviceGroupInfo);
}

async function getServiceGroupInfo({
  serviceGroupName,
}: {
  serviceGroupName: string;
}): Promise<ServiceGroupInfo> {
  const serviceGroup = store
    .get('serviceGroups')
    .find((s) => s.name === serviceGroupName);

  if (!serviceGroup) {
    throw new Error(
      `Service group with the name ${serviceGroupName} does not exist`,
    );
  }

  return {
    serviceGroup: serviceGroup.name,
    services: serviceGroup.services,
  };
}

function printServiceGroupInfo(serviceGroupInfo: ServiceGroupInfo): void {
  prettyPrintKeyValue('🌀 Group Name', serviceGroupInfo.serviceGroup);
  for (const service of serviceGroupInfo.services) {
    prettyPrintKeyValue('📦 Service', chalk.dim(service));
  }
}

async function printInfoOnAllServiceGroups({ json }: { json: boolean }) {
  if (json) {
    const spinner = ora('Fetching info on all packages...').start();

    const serviceGroupsInfo = await Promise.all(
      store
        .get('serviceGroups')
        .map((p) => getServiceGroupInfo({ serviceGroupName: p.name })),
    );

    spinner.clear();

    console.log(JSON.stringify(serviceGroupsInfo, null, 2));
    process.exit(0);
  }

  for (const serviceGroup of store.get('serviceGroups')) {
    const serviceGroupInfo = await getServiceGroupInfo({
      serviceGroupName: serviceGroup.name,
    });
    printServiceGroupInfo(serviceGroupInfo);
    console.log(
      '________________________________________________________________________________',
    );
  }
  process.exit(0);
}

export default new Command('info')
  .description('Print info about a service group')
  .argument('<group>')
  .option(
    '-j, --json',
    'print service group info as stringified json to allow jq piping',
  )
  .action(withErrorHandler(info));
