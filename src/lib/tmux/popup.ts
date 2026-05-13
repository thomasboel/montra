import { buildTmuxCommand, execTmux, TmuxError } from './execTmux.js';
import { escapeShellArg } from '../../utils/shell.js';

export type DisplayPopupOptions = {
  /** Shell command to run inside the popup. */
  command: string;
  /** e.g. '80%' or '60'. */
  width?: string;
  height?: string;
  /** Pass `-E` so the popup auto-closes when the command exits. Defaults to true. */
  closeOnExit?: boolean;
  /** Optional pane to anchor the popup to. */
  targetPane?: string;
};

type TmuxCommandResult<T> =
  | { success: true; data: T }
  | { success: false; error: TmuxError };

export async function displayPopup(
  opts: DisplayPopupOptions,
): Promise<TmuxCommandResult<void>> {
  const closeOnExit = opts.closeOnExit ?? true;

  const flags: ('-B' | '-C' | '-E' | '-K')[] = [];
  if (closeOnExit) flags.push('-E');

  const options: Partial<
    Record<'-w' | '-h' | '-t' | '-x' | '-y' | '-d' | '-e' | '-s' | '-S' | '-b', string>
  > = {};

  if (opts.width) options['-w'] = opts.width;
  if (opts.height) options['-h'] = opts.height;
  if (opts.targetPane) options['-t'] = opts.targetPane;

  const cmd = buildTmuxCommand('display-popup', options, flags, [
    escapeShellArg(opts.command),
  ]);

  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: undefined };
}
