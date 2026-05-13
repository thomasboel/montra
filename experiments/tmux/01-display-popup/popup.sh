#!/bin/bash
echo "Hello from inside display-popup"
echo
echo "tmux version: $(tmux -V)"
echo "TMUX env:     ${TMUX:-<unset>}"
echo "TERM:         $TERM"
echo "size:         ${COLUMNS}x${LINES}"
echo
read -r -p "Type something and press enter: " input
echo
echo "You typed: $input"
echo
read -n 1 -s -r -p "Press any key to close..."
