# 06 — full integration

Goal: combine steps 01–05 into a working demo. Fake cards drawn in the pane, double-click → contextual menu for that card (or "create" menu on empty space), interactive items launch a popup, fake actions flash on the status line.

## Run

From inside a tmux session, in the pane you want bound:

```sh
./run.sh
```

This:
1. captures the current pane id
2. enables tmux mouse mode if needed
3. runs `fake-overview.sh` — clears the pane, draws five card boxes, writes `layout.json` in lockstep with what was drawn
4. installs `DoubleClick1Pane` scoped to this pane, dispatching to `handler.sh`

Now double-click:

- **on a card** → menu titled with the card name; items: Start / Stop / Restart / Modify
  - Start / Stop / Restart → flash a "would …" message on the status line
  - Modify → opens an interactive popup (reuses step 01's `popup.sh`)
- **on empty space** → menu titled "empty"; items: Add new service / Cancel
  - Add → opens the same popup

When done:

```sh
./cleanup.sh
```

…which unbinds, clears the screen, and removes `layout.json`.

## What's pretending and what's real

| piece | real here | will be real in montra |
|---|---|---|
| card boxes | hand-drawn ASCII | `printBoxes` from `overview.ts` |
| layout file | written once by `fake-overview.sh` | written every refresh by `overview.ts` |
| pane scoping | conditional on captured pane id | hook on `pane-focus-in` / `pane-died` for the overview pane |
| binding install | `run.sh` | `overview` command on startup, restoring prior binding on exit |
| action handlers | fake `display-message` / popup | calls into existing `service start/stop/restart/modify` |

## Caveats

- `layout.json` is written once; resizing the window mid-experiment will misalign coords. The real montra version has to rewrite the layout each refresh and probably stamp it with the pane size so a stale layout can be detected.
- The fake `Modify` and `Add` popups don't actually persist anything — they're just demonstrating that the menu-to-popup chain works.
