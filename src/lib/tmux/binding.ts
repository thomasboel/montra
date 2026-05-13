import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

import { buildTmuxCommand, execTmux, TmuxError } from './execTmux.js';

export type Binding = {
  /** Key table, typically `'root'`. */
  table: string;
  /** Key spec, e.g. `'DoubleClick1Pane'`. */
  key: string;
};

type TmuxCommandResult<T> =
  | { success: true; data: T }
  | { success: false; error: TmuxError };

/**
 * Returns the raw `bind-key` line currently set for the given binding, or
 * `null` if no binding is configured. The returned string is a valid tmux
 * config line and can be re-applied via `restoreBinding`.
 */
export async function captureBinding(
  binding: Binding,
): Promise<TmuxCommandResult<string | null>> {
  const cmd = buildTmuxCommand(
    'list-keys',
    { '-T': binding.table },
    [],
    [binding.key],
  );

  const result = await execTmux(cmd);

  if (!result.success) {
    // list-keys exits non-zero when no binding exists for the key.
    if (result.error.type === 'exec' && result.error.error.code === 1) {
      return { success: true, data: null };
    }
    return { success: false, error: result.error };
  }

  const captured = result.stdout.trimEnd();
  if (!captured) {
    return { success: true, data: null };
  }

  return { success: true, data: captured };
}

/**
 * Installs `command` as the binding for `binding`. Goes through a temp
 * config file + `source-file` to avoid shell-escaping nightmares — tmux's
 * own config parser handles the quoting.
 */
export async function installBinding(
  binding: Binding,
  command: string,
): Promise<TmuxCommandResult<void>> {
  const config =
    `unbind-key -T ${binding.table} ${binding.key}\n` +
    `bind-key -T ${binding.table} ${binding.key} ${command}\n`;

  return await sourceConfigSnippet(config);
}

/**
 * Restores a binding previously captured via `captureBinding`. If `captured`
 * is `null`, just unbinds the key.
 */
export async function restoreBinding(
  binding: Binding,
  captured: string | null,
): Promise<TmuxCommandResult<void>> {
  if (captured === null) {
    return await unbindKey(binding);
  }

  const config =
    `unbind-key -T ${binding.table} ${binding.key}\n` + `${captured}\n`;

  return await sourceConfigSnippet(config);
}

export async function unbindKey(
  binding: Binding,
): Promise<TmuxCommandResult<void>> {
  const cmd = buildTmuxCommand(
    'unbind-key',
    { '-T': binding.table },
    [],
    [binding.key],
  );

  const result = await execTmux(cmd);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: undefined };
}

async function sourceConfigSnippet(
  contents: string,
): Promise<TmuxCommandResult<void>> {
  const tmpPath = path.join(
    os.tmpdir(),
    `montra-tmux-${randomBytes(6).toString('hex')}.conf`,
  );

  try {
    await fs.writeFile(tmpPath, contents, 'utf8');
    const cmd = buildTmuxCommand('source-file', {}, [], [tmpPath]);
    const result = await execTmux(cmd);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { type: 'unknown', error: error as Error },
    };
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
}
