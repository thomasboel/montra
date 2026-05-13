#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux." >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmux unbind -T root DoubleClick1Pane
rm -f "$DIR/layout.json"
clear
echo "cleaned up."
