#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux." >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHOW="$DIR/show.sh"
PANE_ID=$(tmux display-message -p '#{pane_id}')

mouse_state=$(tmux show -gv mouse 2>/dev/null || echo off)
if [ "$mouse_state" != "on" ]; then
  echo "Enabling tmux mouse mode (was '$mouse_state')."
  tmux set -g mouse on
fi

tmux bind -T root DoubleClick1Pane \
  if -F "#{==:#{pane_id},$PANE_ID}" \
    "run-shell -b \"'$SHOW' '#{mouse_x}' '#{mouse_y}' '#{pane_id}' '#{pane_top}' '#{pane_left}' '#{pane_width}' '#{pane_height}'\"" \
    "select-pane -t = ; if -F '#{mouse_word}' 'copy-mode -H ; send-keys -X select-word ; run-shell -d 0.3 ; send-keys -X copy-pipe-and-cancel'"

echo "Double-click bound for pane $PANE_ID — each click shows a coords popup."
echo "Run ./cleanup.sh when done."
