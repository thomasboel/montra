import { Command, CommandUnknownOpts } from '@commander-js/extra-typings';
import program from '../../../bin/index.js';

interface CommandTree {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
    variadic: boolean;
  }>;
  options: Array<{
    flags: string;
    required: boolean;
    description?: string;
  }>;
  subcommands: CommandTree[];
}

function getCommandData(cmd: CommandUnknownOpts): CommandTree {
  return {
    name: cmd.name(),
    description: cmd.description(),
    arguments: cmd.registeredArguments.map((arg) => ({
      name: arg.name(),
      description: arg.description,
      required: arg.required,
      variadic: arg.variadic,
    })),
    options: cmd.options.map((opt) => ({
      flags: opt.flags,
      required: opt.required,
      description: opt.description,
    })),
    subcommands: cmd.commands.map(getCommandData),
  };
}

export default new Command('_autocomplete')
  .description('internal command for autocomplete')
  .action(() => {
    const data = program.commands
      .filter((c) => !['_autocomplete', 'docker', 'tmux'].includes(c.name()))
      .map(getCommandData);

    console.log(JSON.stringify(data, null, 2));
  });
