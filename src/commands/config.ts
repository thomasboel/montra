import { Command } from '@commander-js/extra-typings';
import ora from 'ora';

import store, { Config, configValidators } from '../utils/store.js';
import { withErrorHandler } from '../utils/errorHandler.js';
import { getServiceStatus } from './service/status.js';

const setConfig = new Command('set')
  .description('Update a configuration value')
  .argument('<key>')
  .argument('<value>')
  .action(
    withErrorHandler(async (key: keyof Config, value: string) => {
      if (!(key in configValidators)) {
        throw new Error(`No such config key: ${key}`);
      }

      if (value === store.get(key)) {
        console.log(`ℹ️ "${key}" already has value "${value}"`);
        return;
      }

      const validate = configValidators[key];
      if (!validate(value)) {
        throw new Error(`Invalid value "${value}" for key "${key}"`);
      }

      const spinner = ora();

      if (key === 'runtime') {
        spinner.start('Updating runtime...');
        for (const service of store.get('services')) {
          const status = await getServiceStatus(service.name);
          if (status !== 'STOPPED') {
            spinner.clear();
            throw new Error(
              `One or more services are not stopped. Cannot in good faith change runtime with running services.`,
            );
          }
        }
      }

      store.set(key, value);
      spinner.succeed(`✅ Config "${key}" set to "${value}"`);
    }),
  );

const getConfig = new Command('get')
  .description('View a configuration value')
  .argument('<key>')
  .action((key) => {
    const value = store.get(key);
    if (value === undefined) {
      console.log(`No config value set for "${key}"`);
      return;
    }

    switch (typeof value) {
      case 'object':
        console.log(`${key}: ${JSON.stringify(value)}`);
        break;
      default:
        console.log(`${key}: ${value}`);
        break;
    }
  });

const listKeys = new Command('_list-keys')
  .description('List of keys in the store')
  .action(() => {
    for (const key of Object.keys(store.store)) {
      if (key === '__internal__') {
        continue;
      }
      console.log(key);
    }
  });

const getConfigPath = new Command('path')
  .description('Get config path')
  .action(() => {
    console.log(store.path);
  });

export default new Command('config')
  .addCommand(setConfig)
  .addCommand(getConfig)
  .addCommand(getConfigPath)
  .addCommand(listKeys, { hidden: true });
