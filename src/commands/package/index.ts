import { Command } from '@commander-js/extra-typings';

import list from './list.js';
import info from './info.js';
import add from './add.js';
import remove from './remove.js';
import update from './update.js';
import _export from './export.js';
import _import from './import.js';
import subscribe from './subscribe.js';

export default new Command('package')
  .description('Manage groups')
  .addCommand(list)
  .addCommand(info)
  .addCommand(add)
  .addCommand(remove)
  .addCommand(update)
  .addCommand(_export)
  .addCommand(_import)
  .addCommand(subscribe);
