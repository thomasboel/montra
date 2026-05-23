import { promises as fs, Stats } from 'node:fs';

export type FileError =
  | { type: 'read'; error: NodeJS.ErrnoException }
  | { type: 'parse'; error: SyntaxError }
  | { type: 'unknown'; error: Error };

export type FileResult<T> =
  | { success: true; data: T }
  | { success: false; error: FileError };

export async function readFile(
  filePath: string,
): Promise<FileResult<string>> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    if (isErrnoException(error)) {
      return { success: false, error: { type: 'read', error } };
    }
    return {
      success: false,
      error: { type: 'unknown', error: error as Error },
    };
  }
}

export async function readJsonFile<T = unknown>(
  filePath: string,
): Promise<FileResult<T>> {
  const readResult = await readFile(filePath);
  if (!readResult.success) {
    return readResult;
  }

  try {
    const data = JSON.parse(readResult.data) as T;
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: { type: 'parse', error } };
    }
    return {
      success: false,
      error: { type: 'unknown', error: error as Error },
    };
  }
}

export async function stat(filePath: string): Promise<FileResult<Stats>> {
  try {
    const data = await fs.stat(filePath);
    return { success: true, data };
  } catch (error) {
    if (isErrnoException(error)) {
      return { success: false, error: { type: 'read', error } };
    }
    return {
      success: false,
      error: { type: 'unknown', error: error as Error },
    };
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
