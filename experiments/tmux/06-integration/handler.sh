#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYOUT="$DIR/layout.json"
POPUP="$DIR/../01-display-popup/popup.sh"

x=$1
y=$2
pane=$3

card=$(jq -r --argjson x "$x" --argjson y "$y" '
  .cards[]
  | select($x >= .x and $x < (.x + .w) and $y >= .y and $y < (.y + .h))
  | .name
' "$LAYOUT" 2>/dev/null | head -n1)

if [ -z "$card" ]; then
  tmux display-menu -O -t "$pane" -x "$x" -y "$y" -T " empty (x=$x y=$y) " \
    "Add new service" a "display-popup -E -w 60% -h 40% '$POPUP'" \
    '' \
    "Cancel" q ""
else
  tmux display-menu -O -t "$pane" -x "$x" -y "$y" -T " $card " \
    "Start"   s "display-message 'would start $card'" \
    "Stop"    x "display-message 'would stop $card'" \
    "Restart" r "display-message 'would restart $card'" \
    '' \
    "Modify"  m "display-popup -E -w 60% -h 40% '$POPUP'" \
    '' \
    "Cancel"  q ""
fi
