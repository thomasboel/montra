#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# name x y w h
cards=(
  "api      0  0  25 4"
  "worker   26 0  25 4"
  "frontend 52 0  25 4"
  "postgres 0  5  25 4"
  "redis    26 5  25 4"
)

clear

draw_box() {
  local name=$1 x=$2 y=$3 w=$4 h=$5
  local row=$((y + 1))
  local col=$((x + 1))

  printf "\033[%d;%dH╭" "$row" "$col"
  for ((i=2; i<w; i++)); do printf "─"; done
  printf "╮"

  for ((i=1; i<h-1; i++)); do
    printf "\033[%d;%dH│" $((row + i)) "$col"
    printf "\033[%d;%dH│" $((row + i)) $((col + w - 1))
  done

  local label_row=$((row + h/2))
  local label_col=$((col + 2))
  printf "\033[%d;%dH%s" "$label_row" "$label_col" "$name"

  printf "\033[%d;%dH╰" $((row + h - 1)) "$col"
  for ((i=2; i<w; i++)); do printf "─"; done
  printf "╯"
}

{
  echo "{"
  echo "  \"cards\": ["
  first=1
  for entry in "${cards[@]}"; do
    read -r name x y w h <<< "$entry"
    if [ $first -eq 0 ]; then echo ","; fi
    first=0
    printf '    { "name": "%s", "x": %d, "y": %d, "w": %d, "h": %d }' "$name" "$x" "$y" "$w" "$h"
  done
  echo ""
  echo "  ]"
  echo "}"
} > "$DIR/layout.json"

for entry in "${cards[@]}"; do
  read -r name x y w h <<< "$entry"
  draw_box "$name" "$x" "$y" "$w" "$h"
done

printf "\033[12;1H\n"
echo "double-click a card or empty space"
