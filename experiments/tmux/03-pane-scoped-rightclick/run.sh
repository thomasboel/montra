#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux — start a session first and re-run." >&2
  exit 1
fi

PANE_ID=$(tmux display-message -p '#{pane_id}')

mouse_state=$(tmux show -gv mouse 2>/dev/null || echo off)
if [ "$mouse_state" != "on" ]; then
  echo "Enabling tmux mouse mode (was '$mouse_state')."
  tmux set -g mouse on
fi

tmux bind -T root DoubleClick1Pane \
  if -F "#{==:#{pane_id},$PANE_ID}" \
    "display-menu -O -T ' double-click test ' -x M -y M \
       'Open popup' p \"display-popup -E -w 80% -h 80% '$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../01-display-popup/popup.sh'\" \
       'Show pane id' i 'display-message \"clicked in pane #{pane_id}\"' \
       '' \
       'Cancel' q ''" \
    "select-pane -t = ; if -F '#{mouse_word}' 'copy-mode -H ; send-keys -X select-word ; run-shell -d 0.3 ; send-keys -X copy-pipe-and-cancel'"

echo "Double-click is now bound for pane $PANE_ID."
echo "Split a pane and double-click there to confirm word-select still works (scoping)."
echo "Run ./cleanup.sh when done."
