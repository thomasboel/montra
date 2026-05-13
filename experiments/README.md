# experiments

Sandbox for trying tmux capabilities before integrating them into montra. Self-contained — nothing here is imported by the CLI.

Each subdirectory is one numbered experiment. Run them in order; each builds on a primitive verified in the previous step.

## tmux

Requires tmux **3.2+** (for `display-popup`). Check with `tmux -V`.

| # | what we're verifying |
|---|---|
| 01 | `display-popup` runs an interactive command and returns focus cleanly |
| 02 | `display-menu` can launch a `display-popup` |
| 03 | a mouse trigger (`DoubleClick1Pane`) can be scoped to a single pane via a `#{pane_id}` conditional |
| 04 | `#{mouse_x}` / `#{mouse_y}` are reachable from a binding and behave as expected |
| 05 | coord → "card" lookup against a fake layout file |
| 06 | end-to-end: right-click on overview → contextual menu → popup |
