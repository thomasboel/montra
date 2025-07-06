#!/usr/bin/env node

import { program } from '@commander-js/extra-typings';

import config from '../src/commands/config.js';
import service from '../src/commands/service/index.js';
import group from '../src/commands/group/index.js';
import _package from '../src/commands/package/index.js';
import tmuxTest from '../src/commands/internal/tmuxTest.js';
import dockerTest from '../src/commands/internal/dockerTest.js';
import autocomplete from '../src/commands/internal/autocomplete.js';

import { version } from '../src/utils/pkgVersion.js';
import { ensureWatcherRunning } from '../src/watcherManager.js';

program
  .name('montra')
  .version(version)
  .description('interact with your local development environment')
  .addCommand(config)
  .addCommand(service)
  .addCommand(group)
  .addCommand(_package)
  .addCommand(tmuxTest) // For testing the tmux library
  .addCommand(dockerTest) // For testing the docker library
  .addCommand(autocomplete); // Autocomplete command

program.hook('preAction', async () => {
  await ensureWatcherRunning();
});

program.parse(process.argv);

export default program;
