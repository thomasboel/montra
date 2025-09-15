# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# 1.0.1

## Runtime
Moved runtime configuration to the service configuration rather than a global setting.  
This allows running some services in docker and other services in tmux simultaneously. 

## Adding/Modifying service configuration
New service command added to modify service configuration.  
Usage: `mon service modify <service>`. Uses the `inquirer` package for a smooth UX.  

The `mon service add` command was also updated, so now it uses `inquirer` instead of needing all configuration as command options & arguments.  

## Bug fixes
- Fixed `mon service vulnerabilites <service>` command sometimes getting `dataRangeError [ERR_CHILD_PROCESS_STDIO_MAXBUFFER]: stdout maxBuffer length exceeded` by increasing maxBuffer for child_process.
- Fixed internal call to `notify()` in `mon package subscribe <package>` command.
- Fixed default behaviour for `mon service status <service>` command.
