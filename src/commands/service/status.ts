import { Command } from '@commander-js/extra-typings';

import store, { Service } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import {
  getServiceStatus,
  getServiceStatusBulk,
  ServiceStatus,
  statusMap,
} from '../../lib/serviceStatus.js';
import {
  chunkArray,
  padLabel,
  printBox,
  printBoxesSideBySide,
  prettyPrintKeyValue,
} from '../../utils/prettyPrintKeyValue.js';

export async function status(
  serviceName: string,
  { watch }: { watch: number },
): Promise<void> {
  if (serviceName === 'all') {
    const sortedServices = store
      .get('services')
      .sort((a, b) => a.name.localeCompare(b.name));

    if (watch) {
      await printWatchAllStatus(sortedServices, watch);
      return;
    }

    for (const service of sortedServices) {
      await status(service.name, { watch });
    }
    return;
  }

  const serviceStatus = await getServiceStatus(serviceName);

  if (watch) {
    printBox(`${padLabel(serviceName, 20)}\n${statusMap[serviceStatus]}`);
    return;
  }

  prettyPrintKeyValue(serviceName, statusMap[serviceStatus], 40);
}

async function printWatchAllStatus(services: Service[], watch: number) {
  const statusByName = await getServiceStatusBulk(services.map((s) => s.name));

  const sortedByStatus = services
    .map((s) => ({ ...s, status: statusByName.get(s.name) as ServiceStatus }))
    .sort((a, b) => a.status.localeCompare(b.status));

  for (const chunk of chunkArray(sortedByStatus, Number(watch))) {
    const serviceTexts = chunk.map(
      (s) => `${padLabel(s.name, 30)}\n${statusMap[s.status]}`,
    );
    printBoxesSideBySide(...serviceTexts);
  }
}

export default new Command('status')
  .description('Check status of the service')
  .option(
    '-w, --watch [value]',
    'print the service status with the intention of it being watched (for example, `watch -n 10 montra service status -w 3 all`)',
  )
  .argument('<service>', 'use "all" to show status for all services')
  .action(withErrorHandler(status));
