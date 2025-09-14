import Conf from 'conf';

import { version } from './pkgVersion.js';
import { storeMigrations } from './storeMigrations.js';
import { isFilePath } from './isFilePath.js';

export const SERVICE_TYPES = [
  'backend_service',
  'frontend_service',
  'docker_compose_service',
  'lambda',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type Runtime = 'tmux' | 'docker';

export type Service = {
  name: string;
  type: ServiceType;
  repository: string;
  runCommand?: string;
  alias?: string;
  port?: number;
  expectedSecondsToStart: number;
  runtime?: Runtime;
};

export type StartedService = {
  service: Service;
  startedAt: number;
};

export type ServiceGroup = {
  name: string;
  services: string[];
};

export type Package = {
  name: string;
  repository: string;
};

export type Config = {
  runtime: Runtime;
  repositoryDirectory: string;
  services: Service[];
  startedServices: StartedService[];
  serviceGroups: ServiceGroup[];
  packages: Package[];
};

export const configValidators: {
  [K in keyof Config]: (value: string) => boolean;
} = {
  runtime: (value) => ['tmux', 'docker'].includes(value),
  repositoryDirectory: (value) => isFilePath(value),
  startedServices: () => false,
  services: () => false,
  serviceGroups: () => false,
  packages: () => false,
};

const store = new Conf<Config>({
  projectName: 'montra',
  projectVersion: version,
  migrations: storeMigrations,
  defaults: {
    runtime: 'tmux',
    repositoryDirectory: process.env.REPO_DIR ?? '~/repos',
    startedServices: [],
    services: [],
    serviceGroups: [],
    packages: [],
  },
});

export default store;
