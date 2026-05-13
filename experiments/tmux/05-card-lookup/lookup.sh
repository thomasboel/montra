#!/bin/bash
set -e

if [ $# -ne 2 ]; then
  echo "usage: $0 <x> <y>" >&2
  exit 2
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYOUT="$DIR/layout.json"

x=$1
y=$2

result=$(jq -r --argjson x "$x" --argjson y "$y" '
  .cards[]
  | select($x >= .x and $x < (.x + .w) and $y >= .y and $y < (.y + .h))
  | .name
' "$LAYOUT" | head -n1)

if [ -n "$result" ]; then
  echo "$result"
else
  echo "empty"
fi
