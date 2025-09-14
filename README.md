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
 
`mon service list` will list services (`ls` alias).  
`mon service add` will prompt the creation of a new service.  
`mon service remove <service>` will remove a service.  
`mon service info <service>` will print the service configuration and information.  
`mon service modify <service>` will change the service configuration.  
`mon service start <service>` will start the service.  
`mon service stop <service>` will stop the service.  
`mon service restart <service>` will restart the service.  
`mon service status <service>` will get the service status.  
`mon service update <service>` will update the service (git pull > nvm install > nvm use > npm install).  
`mon service vulnerabilities <service>` will list image vulnerabilities from AWS Inspector for the latest image tag (requires valid AWS session - `aws configure sso`).  
`mon service export` used for sharing service configurations with someone else.  
`mon service import "<export-output>"` import all services from someone else's configuration.  

### Groups

Services can be added to groups that can easily be shared with others with export/import capabilities.  
Also helps with separating services from different projects.  

`mon group list` will list all the groups.  
`mon group create backend` will create a group with the name `backend`.  
`mon group add backend postgres my-service other-service ...` will add the services to the group with the name `backend`.  
`mon group remove backend postgres my-service other-service ...` will remove the services from the group with the name `backend`.  
`mon group start backend` will start all the services in the group with the name `backend`.  
`mon group stop backend` will stop all the services in the group with the name `backend`.  
`mon group info backend` will list all the services in the group with the name `backend`.  
`mon group export` used for sharing group configurations with someone else.  
`mon group import "<export-output>"` import all groups from someone else's configuration.  

### Packages

Packages are repositories that don't act as a deployable - e.g. a library.

`mon package list` will list all the packages.  
`mon package add` will prompt the creation of a new package.  
`mon package remove <package>` will remove a package.  
`mon package info <package>` will print the package configuration and information.  
`mon package update <package>` will update the package (git pull > nvm install > nvm use > npm install).
`mon package subscribe <package>` will notify when a new tag (version) is released for the given package (uses registry.npmjs.org to check dist tag)  
`mon package export` used for sharing package configurations with someone else.  
`mon package import "<export-output>"` import all packages from someone else's configuration.
