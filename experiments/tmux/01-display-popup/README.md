# 01 — display-popup smoke test

Goal: confirm `tmux display-popup -E` runs an interactive command in a real pty, accepts input, and returns focus to the originating pane on exit.

## Run

From inside a tmux session:

```sh
./run.sh
```

You should see a centered floating popup. Type something at the prompt, press enter, then any key to close. The popup should disappear and your cursor should return to the pane you launched from.

## What to look for

- Popup actually appears centered and sized at ~80%
- `read` works — i.e. the popup is a real terminal, not a passive overlay
- `$TMUX` is set inside the popup (it inherits the tmux client env)
- After exit, focus returns to the launching pane with no leftover artifacts
