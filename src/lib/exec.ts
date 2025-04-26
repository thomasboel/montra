import { exec, ExecException, ExecOptions } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ExecError =
  | { type: 'exec'; error: ExecException }
  | { type: 'unknown'; error: Error };

type ExecResult =
  | { success: true; stdout: string; stderr: string }
  | { success: false; error: ExecError };

export async function execute(
  command: string,
  options: ExecOptions = {},
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execAsync(command, options);
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

export async function isCommandAvailable(command: string): Promise<boolean> {
  const result = await execute(`zsh -c "command -v ${command}"`);
  return result.success;
}

function isExecException(error: unknown): error is ExecException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
