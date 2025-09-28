import { Command } from '@commander-js/extra-typings';

import store, { Service, ServiceType } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { ChalkColor, printBoxes } from '../../lib/box.js';
import { ServiceStatus } from './status.js';
import { chunkArray } from '../../utils/prettyPrintKeyValue.js';
import { getServiceInfo, ServiceInfo } from './info.js';

const serviceStatusColorMap: Record<ServiceStatus, ChalkColor> = {
  RUNNING: 'green',
  SESSION_EXISTS: 'yellow',
  STOPPED: 'red',
};

const serviceTypeIconMap: Record<ServiceType, string> = {
  backend_service: '⚙️',
  frontend_service: '💻',
  docker_compose_service: '🐳',
  lambda: 'λ',
};

export async function overview(): Promise<void> {
  const services = store.get('services') ?? [];

  const serviceInfos = await Promise.all(
    services.map(async (service) => {
      return getServiceInfo({
        serviceName: service.name,
        status: true,
      });
    }),
  );

  const sortedServices = serviceInfos.sort((a, b) =>
    a.service.localeCompare(b.service),
  );

  const groupedServices = sortedServices.reduce(
    (groups, service) => {
      if (groups[service.type]) {
        groups[service.type] = [...groups[service.type], service];
        return groups;
      }
      groups[service.type] = [service];
      return groups;
    },
    {} as Record<ServiceType, ServiceInfo[]>,
  );

  for (const [type, services] of Object.entries(groupedServices)) {
    console.log(``);
    serviceOverview(services);
  }
}

function serviceOverview(services: ServiceInfo[]) {
  const boxes = services.map((service) => ({
    title: `${serviceTypeIconMap[service.type]} ${service.service}`,
    titlePosition: 'topLeft',
    text: `${service.description}\nruntime: ${service.runtime}\nversion: ${service.version}\nbranch: ${service.branch}`,
    borderColor: service.status
      ? serviceStatusColorMap[service.status]
      : 'white',
    textColor: 'white',
    width: 50,
  }));

  const chunks = chunkArray(boxes, 4);

  for (const chunk of chunks) {
    printBoxes({
      distanceBetween: 5,
      boxes: chunk,
    });
  }
}

export default new Command('overview')
  .alias('ov')
  .description('Experimental command to print an overview of all services')
  .action(withErrorHandler(overview));
