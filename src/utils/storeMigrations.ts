import Conf from 'conf';
import { Config } from './store.js';

/**
 * https://github.com/sindresorhus/conf?tab=readme-ov-file#migrations
 */
export const storeMigrations: Record<string, (store: Conf<Config>) => void> = {
  '1.0.1': (store) => {
    const currentGlobalRuntime = store.get('runtime');
    const currentServices = store.get('services');

    const updatedServices = currentServices.map((service) => ({
      ...service,
      runtime: currentGlobalRuntime,
    }));

    store.set('services', updatedServices);
  },
};
