# 02 — menu → popup

Goal: confirm `display-menu` can launch a `display-popup`, since the eventual flow is right-click → contextual menu → interactive command. Keybinding scoping is out of scope here — it's the next step.

## Run

From inside a tmux session:

```sh
./run.sh
```

A menu appears. Try each item:

- **Echo hello** — runs `display-message` (status-line text at the bottom). Confirms shell-free tmux commands work as menu actions.
- **Open popup** — launches step 01's `popup.sh` via `display-popup`. This is the chain we care about.
- **Cancel** — dismisses without doing anything. `Esc` should also dismiss.

## What to look for

- Menu renders at cursor / pane center
- Popup launched from the menu behaves exactly like step 01 (interactive, returns focus)
- After the popup closes, you're back at the pane (not at a leftover menu)
- No menu/popup state leaks if you cancel or `Esc`
