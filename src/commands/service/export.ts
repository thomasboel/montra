import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { version } from '../../utils/pkgVersion.js';

export async function _export(): Promise<void> {
  const services = store.get('services') ?? [];

  const servicesWithVersion = services.map((service) => ({
    ...service,
    cliVersion: version,
  }));

  console.log(JSON.stringify(servicesWithVersion));
}

export default new Command('export')
  .description('Export services for sharing')
  .action(withErrorHandler(_export));
