#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux — start a session first (e.g. \`tmux new -s sandbox\`) and re-run." >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmux display-popup -E -w 80% -h 80% "$DIR/popup.sh"
