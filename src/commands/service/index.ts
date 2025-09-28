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
import vulnerabilities from './vulnerabilities.js';
import modify from './modify.js';
import overview from './overview.js';
import _export from './export.js';
import _import from './import.js';

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
  .addCommand(info)
  .addCommand(vulnerabilities)
  .addCommand(modify)
  .addCommand(overview)
  .addCommand(_export)
  .addCommand(_import);
