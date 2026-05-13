#!/bin/bash
mx=$1
my=$2
pane=$3
top=$4
left=$5
width=$6
height=$7

LOG=$(mktemp)
cat > "$LOG" <<EOF
mouse position
==============

mouse (pane-relative):  x=$mx  y=$my
pane:                   $pane
pane size:              ${width}x${height}
pane offset (info):     left=$left  top=$top

mouse_x/y come from tmux already pane-relative,
so the offset above is just for context.

EOF

tmux display-popup -E -w 60% -h 50% "cat '$LOG'; rm '$LOG'; read -n 1 -s -r -p 'press any key to close...'"
