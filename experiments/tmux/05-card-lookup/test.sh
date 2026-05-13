#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fail=0

run() {
  local desc=$1 x=$2 y=$3 expected=$4
  local actual
  actual=$("$DIR/lookup.sh" "$x" "$y")
  if [ "$actual" = "$expected" ]; then
    printf "  ✓ %-32s (%3s,%3s) → %s\n" "$desc" "$x" "$y" "$actual"
  else
    printf "  ✗ %-32s (%3s,%3s) → %s (expected %s)\n" "$desc" "$x" "$y" "$actual" "$expected"
    fail=$((fail + 1))
  fi
}

echo "Hits:"
run "top-left of api"          0  0  api
run "middle of api"            12 2  api
run "right edge of api"        24 2  api
run "middle of worker"         38 2  worker
run "middle of frontend"       64 2  frontend
run "middle of postgres"       12 7  postgres
run "middle of redis"          38 7  redis

echo
echo "Misses:"
run "gap between api/worker"   25 2  empty
run "gap between rows"         12 4  empty
run "below all cards"          12 12 empty
run "off-grid x"               99 2  empty
run "off-grid y"               12 99 empty
run "negative x"               -1 2  empty
run "negative y"               12 -1 empty

echo
if [ $fail -eq 0 ]; then
  echo "all passed"
else
  echo "$fail failed"
  exit 1
fi
