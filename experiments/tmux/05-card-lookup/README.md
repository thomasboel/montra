# 05 — coord → card lookup

Goal: verify the hit-testing logic in isolation. Given pane-relative (x, y) — the form tmux gives us, per step 04 — and a fake layout file that mocks what `mon service overview` would write each refresh, resolve the click to a card name or "empty".

No tmux involvement here. We're just nailing down the lookup so step 06 can wire it into a real binding without debugging two things at once.

## Layout shape

`layout.json` contains:

```json
{
  "pane_width": 80,
  "pane_height": 16,
  "cards": [
    { "name": "api",      "x": 0,  "y": 0, "w": 25, "h": 4 },
    ...
  ]
}
```

`pane_width`/`pane_height` are a snapshot of the pane size when the layout was written. Step 05 doesn't use them, but the real montra version will — comparing to the current pane size lets us detect a layout that's stale (e.g. user resized the window between refreshes) and decline to dispatch instead of acting on the wrong card.

`x, y, w, h` are pane-relative; each card occupies columns `[x, x+w)` and rows `[y, y+h)`.

## Run

```sh
./lookup.sh 12 2     # → api
./lookup.sh 38 2     # → worker
./lookup.sh 25 2     # → empty (gap)
./test.sh            # runs a battery of hits and misses
```

## What to verify

- `test.sh` reports all ✓
- Edit `layout.json` and rerun — adding/removing a card changes the result without code changes
- Negative coords or out-of-bounds → `empty` (no crash)
