#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux." >&2
  exit 1
fi

tmux unbind -T root DoubleClick1Pane
echo "Unbound DoubleClick1Pane (default word-select restored)."
