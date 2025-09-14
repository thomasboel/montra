# Montra CLI Tool

CLI tool for managing arbitrary services running locally.  
Services can with ease be started, stopped or restarted.  
Configuration that allows grouping of just the services you need to run on a day-to-day basis.

## Pre-requisites

- [jq](https://jqlang.org/download/) - like `sed`, but for JSON data

The default configuration uses [tmux](https://github.com/tmux/tmux/wiki).  
If you don't want to use tmux you can change the runtime with: `mon config set runtime <runtime>`.  
Currently supported runtimes: `[ 'docker', 'tmux' ]`.

_However, `tmux` is still required for the watcher at the moment._

## Installation

1. `nvm install && npm install`
2. `npm run build`
3. Follow next steps below depending on OS ⬇️

### MacOS / Linux

1. run `zsh install.sh`

### Windows (Untested)

1. Make the path where your repos are available at the environment variable `REPO_DIR`
2. `npm link` - If you always want the CLI available you will have to do something similar to what the `install.sh` script does. (might be able to use the npm package `pkg` to create an executable, though that might require having to change the tsconfig module to CommonJS).

## Local Development

1. Follow the installation steps above ⬆️
2. `npm run dev` > any changes are immediately reflected in the CLI

### Project Structure

```bash
.
├── src/                  # Main source code for the CLI
│   ├── commands/         # CLI command definitions (e.g., group, service, etc.)
│   ├── lib/              # Custom libraries
│   ├── utils/            # Shared utility functions and helpers
│   ├── watcher.ts        # Entry point for the Watcher
│   └── watcherManager.ts # Exports a function that ensures watcher is up and running if system requirements are met
└── bin/                  # CLI executable entry file as well as bash autocompletion script
```

### Watcher

The watcher is a bundled service that polls every 5 seconds to check the status for any services that were recently started.  
It will notify the user through an OS specific notification with a ping, if a recently started service did not successfully
start after the "expected seconds to start" for the given service.

This is necessary because the service start command is considered successful, when the service run command is issued in the configured
runtime, and not when its status is `RUNNING`. This could be due to a missing node module, a dependant service is down, etc.  
The reason the service start command behaves like this, is because we don't want to block every service start command by
waiting for the service to be fully up and running.

The watcher will automatically start up if it is not running.

### Tmux debugging

For tmux command debugging, add the following to bin/index.ts:

```typescript
import { setDebug } from '../../lib/tmux/tmux.js';
setDebug(true);
```

# CLI Usage

_This CLI Usage section assumes the CLI entrypoint is the default "mon" - swap with your entrypoint._ 

Since this is subject to evolve and change over time, refer to `mon --help`.  
This also works out the box for new and existing commands.

## Managing services

### Services
 
`mon service add` To add new service.  
`mon service list` To list services (`ls` alias).  
`mon service remove <service>` To remove a service.  
`mon service info <service>` To list the service configuration and information.  
`mon service modify <service>` To change the service configuration.  
`mon service start <service>` To start the service.  
`mon service stop <service>` To stop the service.  
`mon service restart <service>` To restart the service.  
`mon service status <service>` To get the service status.  
`mon service update <service>` To update the service (git pull > nvm install > nvm use > npm install).  
`mon service vulnerabilities <service>` To list image vulnerabilities from AWS Inspector for the latest image tag (requires valid AWS session - `aws configure sso`).  
`mon service export` Used for sharing service configurations with someone else.  
`mon service import "<export-output>"` Import all services from someone else's configuration.  

### Groups

Services can be added to groups that can easily be shared with others with export/import capabilities.  
`mon group create backend` will create a group with the name `tprm`.  
`mon group add backend postgres my-service other-service ...` will add services to the group.  
`mon group start backend` will start all the services in the group.
