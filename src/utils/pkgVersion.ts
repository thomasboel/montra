// src/utils/pkgVersion.ts
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const pkg = require(resolve(__dirname, '../../package.json'));

export const version = pkg.version as string;
