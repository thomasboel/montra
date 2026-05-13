# 04 — mouse coordinates

Goal: confirm `#{mouse_x}` and `#{mouse_y}` are reachable from a binding's command and figure out **what they're relative to**, since step 05's card hit-testing depends on knowing.

## Finding

`#{mouse_x}` and `#{mouse_y}` are **pane-relative** out of the box — tmux already does the offset translation for us. Verified by binding the trigger to a pane that's not at `(0, 0)` (right side of a horizontal split) and observing that `mouse_x` stayed within `[0, pane_width)` rather than ranging across the whole window.

Practical implication for montra: card hit-testing in step 05 can compare `mouse_y` directly to row ranges within the overview pane. No `pane_left`/`pane_top` subtraction needed.

## Run

From inside a tmux session, in the pane you want bound:

```sh
./run.sh
```

Now double-click. A popup shows:

```
mouse:        x=… y=…
pane:         %N
pane offset:  left=… top=…   (informational — NOT subtracted)
pane size:    WxH
```

## What to verify

- Single full-window pane: `mouse` lies in `[0, width) × [0, height)`
- After splitting and binding to the **right** pane: `mouse_x` is small near the left edge of *that pane*, even though the pane offset shows `left>0`
- Top-left of the pane → near `(0, 0)`; bottom-right → near `(width-1, height-1)`
- The status bar at the bottom is *not* part of any pane — clicks there don't reach the binding (because the trigger is `DoubleClick1Pane`)

When done:

```sh
./cleanup.sh
```
