import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import { debug } from './tmux.js';

const execAsync = promisify(exec);

type TmuxCommandString = string & { __tmuxBrand: true };

const tmuxCommandTree = {
  'new-session': {
    alias: 'new',
    flags: ['-d', '-P', '-X', '-D', '-E', '-A'],
    options: ['-s', '-c', '-n', '-e', '-F', '-x', '-y', '-t'],
    args: ['command'],
  },
  'list-sessions': {
    alias: 'ls',
    flags: [],
    options: ['-F', '-f'],
    args: [],
  },
  'kill-session': {
    alias: 'kill',
    flags: ['-a', '-C'],
    options: ['-t'],
    args: [],
  },
  'has-session': {
    alias: 'has',
    flags: [],
    options: ['-t'],
    args: [],
  },
  'new-window': {
    alias: 'neww',
    flags: ['-a', '-b', '-d', '-k', '-P', '-S'],
    options: ['-c', '-e', '-F', '-n', '-t'],
    args: ['shell-command'],
  },
  'list-windows': {
    alias: 'lsw',
    flags: ['-a'],
    options: ['-F', '-f', '-t'],
    args: [],
  },
  'kill-window': {
    alias: 'killw',
    flags: ['-a'],
    options: ['-t'],
    args: [],
  },
  'capture-pane': {
    alias: 'capturep',
    flags: ['-a', '-C', '-e', '-J', '-N', '-p', '-P', '-q', '-T'],
    options: ['-b', '-E', '-S', '-t'],
    args: [],
  },
  'set-window-option': {
    alias: 'setw',
    flags: ['-a', '-F', '-g', '-o', '-q', '-u'],
    options: ['-t'],
    args: ['value'],
  },
} as const;

type TmuxCommand = keyof typeof tmuxCommandTree;

type TmuxCommandSpec<T extends TmuxCommand> = (typeof tmuxCommandTree)[T];

export function buildTmuxCommand<T extends TmuxCommand>(
  command: T,
  options: Partial<Record<TmuxCommandSpec<T>['options'][number], string>>,
  flags: TmuxCommandSpec<T>['flags'][number][],
  args: string[] = [],
): TmuxCommandString {
  const cmdParts = ['tmux', command];

  for (const flag of flags) {
    cmdParts.push(flag);
  }

  for (const [opt, val] of Object.entries(options)) {
    cmdParts.push(opt, val as string);
  }

  cmdParts.push(...args);

  return cmdParts.join(' ') as TmuxCommandString;
}

export type TmuxError =
  | { type: 'exec'; error: ExecException }
  | { type: 'internal'; error: Error }
  | { type: 'unknown'; error: Error };

type ExecTmuxResult =
  | { success: true; stdout: string; stderr: string }
  | { success: false; error: TmuxError };

export async function execTmux(
  command: TmuxCommandString,
): Promise<ExecTmuxResult> {
  if (debug) {
    console.log(`[tmux debug] Intending to execute: ${command}`);
  }

  if (!command.trim().startsWith('tmux ')) {
    return {
      success: false,
      error: { type: 'internal', error: new Error('Expected a tmux command') },
    };
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    if (isExecException(error)) {
      return { success: false, error: { type: 'exec', error } };
    }
    return {
      success: false,
      error: { type: 'unknown', error: error as Error },
    };
  }
}

function isExecException(error: unknown): error is ExecException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
