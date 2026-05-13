#!/bin/bash
set -e

if [ -z "$TMUX" ]; then
  echo "Not inside tmux — start a session first (e.g. \`tmux new -s sandbox\`) and re-run." >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POPUP="$DIR/../01-display-popup/popup.sh"

tmux display-menu -T " menu → popup test " \
  "Echo hello"  h "display-message 'hello from menu'" \
  "Open popup"  p "display-popup -E -w 80% -h 80% '$POPUP'" \
  '' \
  "Cancel"      q ""
