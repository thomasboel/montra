# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`montra` is a Node/TypeScript CLI (binary name `mon`) that wraps locally-running services so they can be started, stopped, and inspected uniformly regardless of whether they run in a `tmux` pane or a `docker` container. A "service" is a small config record (name, repo path, port, run command, runtime) persisted in user config via `conf`. Services can be grouped, and read-only "packages" (libraries) are tracked separately.

The companion landing-page repo lives at `../montra.dev` (Next.js); this repo is the CLI itself.

## Build & develop

- `nvm install && npm install` — Node version pinned by `.nvmrc` (22.14.0)
- `npm run build` — `tsc` compile to `dist/` plus copies `package.json` (the runtime needs `dist/package.json` to read its version via `src/utils/pkgVersion.ts`)
- `npm run dev` — `tsc --watch`; the installed `mon` shim runs `dist/bin/index.js`, so a watch build means changes are immediately reflected
- `zsh install.sh` — installs a `~/bin/<alias>` shell wrapper (default alias `mon`) that `nvm use`s 22.14.0 and execs `node $REPO_DIR/montra/dist/bin/index.js`. Also wires up `bash-completion.sh` and exports `REPO_DIR`.

There is no test suite and no lint script. Prettier is configured (`.prettierrc`).

The `mon dockerTest` and `mon tmuxTest` internal commands exist for ad-hoc testing of the docker/tmux library wrappers — not a substitute for tests, but useful when iterating on `src/lib/`.

## Architecture

### Command structure (Commander)

Entry: `bin/index.ts`. Top-level commands are registered there. Each top-level command is a directory under `src/commands/` whose `index.ts` builds a `Command` and `addCommand`s its subcommand files. Pattern is consistent across `service/`, `group/`, `package/`:

- one file per subcommand (`start.ts`, `stop.ts`, …) exporting a default `Command`
- the file also exports the underlying async function so other commands can call it directly (e.g. `group start` calls `service start`)
- actions are wrapped with `withErrorHandler` from `src/utils/errorHandler.ts`, which prints `❌ <message>` and `process.exit(1)`

To add a new command: create the file under the relevant dir, export the action function and a default `Command`, register it in that dir's `index.ts`. For a brand-new top-level command, also register in `bin/index.ts`. (The landing page advertises this as the extension model.)

### Persistent state

A single `Conf` store at `src/utils/store.ts` holds everything: `runtime`, `repositoryDirectory`, `services`, `serviceGroups`, `packages`, and `startedServices`. The store is keyed by `projectVersion` (`package.json` version) and runs migrations from `src/utils/storeMigrations.ts` whenever that version changes — so bumping the package version triggers migrations, and any schema change to `Config` likely needs a corresponding migration entry.

`configValidators` in `store.ts` is the allowlist for `mon config set` — only keys with a validator are user-settable.

### Runtime abstraction (tmux vs docker)

Services run under one of two runtimes, configured globally (`mon config set runtime …`) but overridable per service. The two runtimes are *not* polymorphic behind a common interface — `service/start.ts`, `service/stop.ts`, `service/status.ts` etc. each branch on `service.runtime` and call into `src/lib/tmux/` or `src/lib/docker/`.

- **tmux**: services are grouped by `service.type` as the tmux session, with one window per service (named by `alias ?? name`). `src/lib/tmux/tmux.ts` exposes typed wrappers around `tmux` shell invocations; `wrapShellCommand` injects `nvm use` whenever the command contains `npm `.
- **docker**: a single `docker-compose.yml` at `<repositoryDirectory>/coms/docker-compose.yml` is treated as the source of truth. `findComposeServiceByImage` matches the service's `repository` field against image names in that compose file. Standalone `docker_compose_service` entries instead use a compose file inside the service's own repo.

### Status detection

`getServiceStatus` in `src/commands/service/status.ts` is the single source of truth and is reused widely (start, stop, watcher, config-runtime guard). Logic:
1. If the service has a `port`, try a Kubernetes-style liveness probe parsed out of `deployment/production/<repo>.yaml` via `yq`. Fall back to `lsof -n -i :<port> | grep LISTEN`.
2. Otherwise check the runtime-specific session/container existence → returns `SESSION_EXISTS` (tmux window or docker container present but port not responding) vs `STOPPED`.

### Watcher

`bin/index.ts` registers a `preAction` hook that calls `ensureWatcherRunning()` before every command. This spawns `node dist/src/watcher.js` inside a dedicated tmux session (`montra_internal:watcher`) if one isn't already running. The watcher polls `startedServices` every 5s and OS-notifies if a service hasn't reached `RUNNING` within `expectedSecondsToStart` (×3 for docker). Implications:

- Tmux is required for the watcher even when `runtime=docker` — `ensureWatcherRunning` no-ops if `tmux` isn't on `PATH`.
- The watcher reads/writes the same `conf` store as the CLI; `start.ts` appends to `startedServices`, the watcher drains expired entries.
- Because the watcher path is `<repositoryDirectory>/montra/dist/src/watcher.js`, this repo is expected to live at `$REPO_DIR/montra` in installed setups.

### External tool dependencies

Beyond `tmux`/`docker`, the CLI shells out to `jq`, `yq`, `lsof`, `curl`, `nvm`, `git`, `npm`, and (for `service vulnerabilities`) `aws`. Treat these as runtime requirements rather than dev-only.

## Conventions worth knowing

- ESM only (`"type": "module"`, `module: Node16`). Local imports must include `.js` extensions even though sources are `.ts` — the compiler does not rewrite them.
- Async actions return a `{ success: true, data } | { success: false, error }` discriminated union from the tmux/docker libs. Don't throw across that boundary; surface errors through the result and let the calling command translate to a thrown `Error` for `withErrorHandler` to format.
- Service lookups generally accept either `name` or `alias` (`s => [s.name, s.alias].includes(serviceName)`). Preserve that when adding new lookups.
- `console.log` with emoji prefixes (`✅`, `❌`, `⚠️`, `ℹ️`, `🟢/🟡/🔴`) is the established UX — match it rather than introducing a logger.
- For tmux command debugging, `setDebug(true)` from `src/lib/tmux/tmux.js` logs every generated tmux command.
