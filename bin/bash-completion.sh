#!/usr/bin/env bash

_montra_completions() {
  local cur prev
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD - 1]}"

  local root_actions=("service group package config tmux docker")
  local service_actions=("start stop restart status add remove update info export import vulnerabilities list modify")
  local group_actions=("create delete add remove list info export import start stop")
  local package_actions=("add remove list info update export import subscribe")

  CONFIG_PATH=""

  # Try macOS path
  if [ -f "$HOME/Library/Preferences/montra-nodejs/config.json" ]; then
    CONFIG_PATH="$HOME/Library/Preferences/montra-nodejs/config.json"

  # Try Linux path
  elif [ -f "$HOME/.config/montra-nodejs/config.json" ]; then
    CONFIG_PATH="$HOME/.config/montra-nodejs/config.json"

  # Try Windows path via WSL or Git Bash
  elif [ -f "/c/Users/$USERNAME/AppData/Roaming/montra-nodejs/config.json" ]; then
    CONFIG_PATH="/c/Users/$USERNAME/AppData/Roaming/montra-nodejs/config.json"

  # Fallback: use CLI to print path or output config
  else
    CONFIG_PATH="$(mon config path 2>/dev/null || echo "")"
  fi

  local services
  services=$(cat $CONFIG_PATH | jq '.services[].name' 2>/dev/null)

  local groups
  groups=$(cat $CONFIG_PATH | jq '.serviceGroups[].name' 2>/dev/null)

  local packages
  packages=$(cat $CONFIG_PATH | jq '.packages[].name' 2>/dev/null)

  local config_keys
  config_keys=$(cat $CONFIG_PATH | jq 'keys[]' 2>/dev/null)

  case $COMP_CWORD in
    1)
      COMPREPLY=($(compgen -W "${root_actions[*]}" -- "$cur"))
      ;;
    2)
      if [[ "$prev" == "service" ]]; then
        COMPREPLY=($(compgen -W "${service_actions[*]}" -- "$cur"))
      elif [[ "$prev" == "config" ]]; then
        COMPREPLY=($(compgen -W "set get" -- "$cur"))
      elif [[ "$prev" == "group" ]]; then
        COMPREPLY=($(compgen -W "${group_actions[*]}" -- "$cur"))
      elif [[ "$prev" == "package" ]]; then
        COMPREPLY=($(compgen -W "${package_actions[*]}" -- "$cur"))
      fi
      ;;
    3)
      if [[ "${COMP_WORDS[1]}" == "service" && " ${service_actions[*]} " == *" ${COMP_WORDS[2]} "* ]] && [ "$prev" != "add" ]; then
        COMPREPLY=($(compgen -W "${services[*]} all" -- "$cur"))
      elif [[ "${COMP_WORDS[1]}" == "config" ]]; then
        COMPREPLY=($(compgen -W "${config_keys[*]}" -- "$cur"))
      elif [[ "${COMP_WORDS[1]}" == "group" && " ${group_actions[*]} " == *" ${COMP_WORDS[2]} "* ]] && [ "$prev" != "create" ] && [ "$prev" != "list" ] && [ "$prev" != "export" ] && [ "$prev" != "import" ]; then
        COMPREPLY=($(compgen -W "${groups[*]}" -- "$cur"))
      elif [[ "${COMP_WORDS[1]}" == "package" && " ${package_actions[*]} " == *" ${COMP_WORDS[2]} "* ]] && [ "$prev" != "add" ] && [ "$prev" != "list" ]; then
        COMPREPLY=($(compgen -W "${packages[*]} all" -- "$cur"))
      fi
      ;;
    *)
      if [[ "${COMP_WORDS[1]}" == "group" && " ${group_actions[*]} " == *" ${COMP_WORDS[2]} "* ]] && [[ "${COMP_WORDS[2]}" == "add" || "${COMP_WORDS[2]}" == "remove" ]]; then
        COMPREPLY=($(compgen -W "${services[*]}" -- "$cur"))
      fi
  esac
}

complete -F _montra_completions mon
