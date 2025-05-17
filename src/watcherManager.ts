import path from 'node:path';
import { newSession, windowExists } from './lib/tmux/tmux.js';
import store from './utils/store.js';
import { isCommandAvailable } from './lib/exec.js';

const WATCHER_SESSION = 'montra_internal';
const WATCHER_WINDOW = 'watcher';

export async function ensureWatcherRunning() {
  const isTmuxAvailable = await isCommandAvailable('tmux');

  if (!isTmuxAvailable) {
    return;
  }

  const watcherExists = await windowExists({
    sessionName: WATCHER_SESSION,
    windowName: WATCHER_WINDOW,
  });

  if (watcherExists) return;

  const result = await newSession({
    sessionName: WATCHER_SESSION,
    windowName: WATCHER_WINDOW,
    entrypoint: path.resolve(
      store.get('repositoryDirectory'),
      'montra',
    ),
    command: `node dist/src/watcher.js`,
    keepOpen: false,
  });

  if (!result.success) {
    console.error(`❌ Failed to start watcher: ${result.error.error.message}`);
  }
}
