# 03 — pane-scoped double-click

Goal: bind a mouse trigger so it only opens our menu in **one specific pane** (the one we'd run `mon service overview` in), and behaves normally everywhere else.

## Why double-click and not right-click

iTerm2 (and most terminal emulators on macOS) intercept right-click for their own context menu before tmux ever sees it. Reconfiguring iTerm2 works but ties the feature to a specific terminal. Double-click is forwarded to tmux through standard mouse reporting and works in any terminal.

## Approach

`DoubleClick1Pane` is a global root-table binding — there's no native "bind only in this pane" in tmux. We work around it with a conditional inside the binding:

```
bind -T root DoubleClick1Pane if -F '#{==:#{pane_id},<captured-id>}' \
  'display-menu …' \
  '<default word-select behavior>'
```

`#{pane_id}` in the conditional resolves at trigger time to the pane where the click happened, so:
- Double-click in the captured pane → menu
- Double-click anywhere else → normal tmux word-selection (preserved by the else branch)

## Run

From inside a tmux session, in the pane you want the menu scoped to:

```sh
./run.sh
```

This:
1. captures the current pane id
2. enables tmux mouse mode if it isn't already on
3. installs the conditional `DoubleClick1Pane` binding

Now test:

- **Double-click in this pane** — menu appears
- **Split a pane** (`prefix + "` or `prefix + %`) and double-click a word in the new pane — the word should be selected (default tmux behavior preserved)
- **Switch focus back and double-click** — menu appears again

When done:

```sh
./cleanup.sh
```

…which unbinds `DoubleClick1Pane` (restoring tmux's built-in default).

## Caveats worth noting

- Pane ids are ephemeral. If the captured pane closes and a new one is created, the new pane gets a different id and the binding silently falls through to word-select. In montra, the binding has to be re-installed each time `overview` starts — probably via a `pane-focus-in` hook on the overview pane, undone on `pane-died`.
- We override the global `DoubleClick1Pane` binding for the duration. The else branch reproduces the default behavior so non-target panes still word-select, but if the user has a custom binding it'll be replaced until cleanup.
- Mouse mode is left enabled after cleanup (assume the user wanted it on regardless).
