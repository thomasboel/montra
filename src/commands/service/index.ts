import { Command } from '@commander-js/extra-typings';

import list from './list.js';
import status from './status.js';
import start from './start.js';
import stop from './stop.js';
import restart from './restart.js';
import add from './add.js';
import remove from './remove.js';
import update from './update.js';
import info from './info.js';

export default new Command('service')
  .description('Manage services')
  .addCommand(list)
  .addCommand(start)
  .addCommand(stop)
  .addCommand(restart)
  .addCommand(status)
  .addCommand(add)
  .addCommand(remove)
  .addCommand(update)
  .addCommand(info);

// TODO: Add import and export commands
