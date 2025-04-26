import { buildTmuxCommand, execTmux, TmuxError } from './execTmux.js';

// ========== utility functions start ========== //
// Update debug to true with setDebug to enable console logging of all generated tmux commands the code intends to run.
export let debug = false;
export function setDebug(value: boolean) {
  debug = value;
}

const shell = 'zsh';

function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

function wrapShellCommand(command: string, keepOpen = true): string {
  let finalCommand = command;

  if (finalCommand.includes('npm ')) {
    finalCommand = `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; nvm use; ${finalCommand}`;
  }

  if (keepOpen) {
    finalCommand = `${finalCommand} ; exec ${shell}`;
  }

  return `${escapeShellArg(finalCommand)}`;
}

// ========== utility functions end ========== //

type TmuxCommandResult<T> =
  | { success: true; data: T }
  | { success: false; error: TmuxError };

export async function listSessions(): Promise<TmuxCommandResult<string[]>> {
  const cmd = buildTmuxCommand(
    'list-sessions',
    { '-F': "'#{session_name}'" },
    [],
  );

  const result = await execTmux(cmd);

  if (!result.success) {
    if (result.error.type === 'exec' && result.error.error.code === 1) {
      return { success: true, data: [] }; // No sessions
    }
    return { success: false, error: result.error };
  }

  const sessions = result.stdout.trim().split('\n').filter(Boolean);
  return { success: true, data: sessions };
}

export async function sessionExists(sessionName: string): Promise<boolean> {
  const result = await listSessions();

  if (!result.success) {
    return false; // If there's an error fetching the sessions, assume the session doesn't exist
  }

  return result.data.includes(sessionName);
}

export async function ensureSessionExists(
  sessionName: string,
): Promise<TmuxCommandResult<void>> {
  const exists = await sessionExists(sessionName);
  if (!exists) {
    return {
      success: false,
      error: {
        type: 'internal',
        error: new Error(`Session ${sessionName} does not exist`),
      },
    };
  }

  return { success: true, data: undefined }; // No need for data, just confirming success
}

export async function listWindows(
  sessionName: string,
): Promise<TmuxCommandResult<string[]>> {
  const sessionCheck = await ensureSessionExists(sessionName);
  if (!sessionCheck.success) {
    return sessionCheck;
  }

  const cmd = buildTmuxCommand(
    'list-windows',
    { '-F': "'#{window_name}'", '-t': sessionName },
    [],
  );

  const result = await execTmux(cmd);

  if (!result.success) {
    if (result.error.type === 'exec' && result.error.error.code === 1) {
      return { success: true, data: [] }; // No windows
    }
    return { success: false, error: result.error };
  }

  const windows = result.stdout.trim().split('\n').filter(Boolean);
  return { success: true, data: windows };
}

export async function windowExists({
  sessionName,
  windowName,
}: {
  sessionName: string;
  windowName: string;
}): Promise<boolean> {
  const result = await listWindows(sessionName);

  if (!result.success) {
    return false;
  }

  return result.data.includes(windowName);
}

export async function ensureWindowExists({
  sessionName,
  windowName,
}: {
  sessionName: string;
  windowName: string;
}): Promise<TmuxCommandResult<void>> {
  const exists = await windowExists({ sessionName, windowName });
  if (!exists) {
    return {
      success: false,
      error: {
        type: 'internal',
        error: new Error(
          `Window ${windowName} does not exist in session ${sessionName}`,
        ),
      },
    };
  }

  return { success: true, data: undefined }; // No need for data, just confirming success
}

export async function newSession({
  sessionName,
  windowName,
  entrypoint,
  command,
  keepOpen = true,
}: {
  sessionName: string;
  windowName?: string;
  entrypoint?: string;
  command?: string;
  keepOpen?: boolean;
}): Promise<TmuxCommandResult<boolean>> {
  if (await sessionExists(sessionName)) {
    return {
      success: false,
      error: {
        type: 'internal',
        error: new Error(`Session ${sessionName} already exist`),
      },
    };
  }

  const args = command ? [wrapShellCommand(command, keepOpen)] : [];
  const cmd = buildTmuxCommand(
    'new-session',
    { '-s': sessionName, '-n': windowName, '-c': entrypoint },
    ['-d'],
    args,
  );
  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: true };
}

export async function killSession(
  sessionName: string,
): Promise<TmuxCommandResult<boolean>> {
  const cmd = buildTmuxCommand('kill-session', { '-t': sessionName }, []);
  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: true };
}

export async function newWindow({
  sessionName,
  windowName,
  entrypoint,
  command,
  keepOpen = true,
}: {
  sessionName: string;
  windowName: string;
  entrypoint?: string;
  command?: string;
  keepOpen?: boolean;
}): Promise<TmuxCommandResult<boolean>> {
  const sessionCheck = await ensureSessionExists(sessionName);
  if (!sessionCheck.success) {
    return sessionCheck;
  }

  if (await windowExists({ sessionName, windowName })) {
    return {
      success: false,
      error: {
        type: 'internal',
        error: new Error(
          `A window with the name ${windowName} already exists in the session ${sessionName}`,
        ),
      },
    };
  }

  const args = command ? [wrapShellCommand(command, keepOpen)] : [];
  const cmd = buildTmuxCommand(
    'new-window',
    { '-t': sessionName, '-n': windowName, '-c': entrypoint },
    ['-d'],
    args,
  );

  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: true };
}

export async function killWindow({
  sessionName,
  windowName,
}: {
  sessionName: string;
  windowName: string;
}): Promise<TmuxCommandResult<boolean>> {
  const windowCheck = await ensureWindowExists({ sessionName, windowName });
  if (!windowCheck.success) {
    return windowCheck;
  }

  const cmd = buildTmuxCommand(
    'kill-window',
    { '-t': `${sessionName}:${windowName}` },
    [],
  );
  const result = await execTmux(cmd);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: true };
}

export { buildTmuxCommand, execTmux } from './execTmux.js';
