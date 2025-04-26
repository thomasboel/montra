import Conf from 'conf';
import { Config } from './store.js';

/**
 * https://github.com/sindresorhus/conf?tab=readme-ov-file#migrations
 */
export const storeMigrations: Record<string, (store: Conf<Config>) => void> =
  {};
