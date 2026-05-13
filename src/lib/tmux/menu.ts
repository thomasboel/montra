import { buildTmuxCommand, execTmux, TmuxError } from './execTmux.js';
import { escapeShellArg } from '../../utils/shell.js';

export type MenuItem =
  | { type: 'item'; label: string; key: string; command: string }
  | { type: 'separator' };

export type MenuPosition =
  | { kind: 'mouse' }
  | { kind: 'center' }
  | { kind: 'paneRelative'; x: number; y: number; targetPane: string };

export type DisplayMenuOptions = {
  title?: string;
  items: MenuItem[];
  position: MenuPosition;
  /** Keep the menu open across mouse-up events; pass `-O` to tmux. */
  persistOnMouseRelease?: boolean;
};

type TmuxCommandResult<T> =
  | { success: true; data: T }
  | { success: false; error: TmuxError };

export async function displayMenu(
  opts: DisplayMenuOptions,
): Promise<TmuxCommandResult<void>> {
  const flags: ('-O' | '-M')[] = [];
  if (opts.persistOnMouseRelease) flags.push('-O');

  const options: Partial<
    Record<'-T' | '-t' | '-x' | '-y' | '-c' | '-C' | '-S', string>
  > = {};

  if (opts.title) options['-T'] = escapeShellArg(opts.title);

  switch (opts.position.kind) {
    case 'mouse':
      options['-x'] = 'M';
      options['-y'] = 'M';
      break;
    case 'center':
      options['-x'] = 'C';
      options['-y'] = 'C';
      break;
    case 'paneRelative':
      options['-t'] = opts.position.targetPane;
      options['-x'] = String(opts.position.x);
      options['-y'] = String(opts.position.y);
      break;
  }

  const args: string[] = [];
  for (const item of opts.items) {
    if (item.type === 'separator') {
      args.push("''");
    } else {
      args.push(escapeShellArg(item.label));
      args.push(escapeShellArg(item.key));
      args.push(escapeShellArg(item.command));
    }
  }

  const cmd = buildTmuxCommand('display-menu', options, flags, args);
  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: undefined };
}
