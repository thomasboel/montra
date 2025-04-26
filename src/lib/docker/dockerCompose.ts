import { promisify } from 'util';
import { exec, ExecException } from 'child_process';
import path from 'path';

const execAsync = promisify(exec);

export type DockerError =
  | { type: 'exec'; error: ExecException }
  | { type: 'unknown'; error: Error };

export type DockerCommandResult =
  | { success: true }
  | { success: false; error: DockerError };

type DockerComposeUpOptions = {
  filePath: string;
  serviceNames?: string[];
};

type DockerComposeStopOptions = DockerComposeUpOptions;

export async function dockerComposeUp({
  filePath,
  serviceNames = [],
}: DockerComposeUpOptions): Promise<DockerCommandResult> {
  try {
    const args: string[] = ['-f', path.resolve(filePath)];

    args.push('up', '-d');

    if (serviceNames.length > 0) {
      args.push(...serviceNames);
    }

    const command = `docker-compose ${args.join(' ')}`;

    await execAsync(command);

    return { success: true };
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

export async function dockerComposeStop({
  filePath,
  serviceNames = [],
}: DockerComposeStopOptions): Promise<DockerCommandResult> {
  try {
    const args: string[] = ['-f', path.resolve(filePath)];

    args.push('stop');

    if (serviceNames.length > 0) {
      args.push(...serviceNames);
    }

    const command = `docker-compose ${args.join(' ')}`;

    await execAsync(command);

    return { success: true };
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
