import fs from 'fs';
import path from 'path';

export function isFilePath(input: string): boolean {
  try {
    const resolved = path.resolve(input);
    return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
  } catch {
    return false;
  }
}
