import { Command } from '@commander-js/extra-typings';

import create from './create.js';
import _delete from './delete.js';
import list from './list.js';
import info from './info.js';
import add from './add.js';
import remove from './remove.js';
import modify from './modify.js';
import _export from './export.js';
import _import from './import.js';
import start from './start.js';
import stop from './stop.js';

export default new Command('group')
  .description('Manage groups')
  .addCommand(create)
  .addCommand(_delete)
  .addCommand(list)
  .addCommand(info)
  .addCommand(add)
  .addCommand(remove)
  .addCommand(modify)
  .addCommand(_export)
  .addCommand(_import)
  .addCommand(start)
  .addCommand(stop);
