const tmuxCommands = [
  'attach-session (attach) [-dErx] [-c working-directory] [-f flags] [-t target-session]',
  'bind-key (bind) [-nr] [-T key-table] [-N note] key [command [arguments]]',
  'break-pane (breakp) [-abdP] [-F format] [-n window-name] [-s src-pane] [-t dst-window]',
  'capture-pane (capturep) [-aCeJNpPqT] [-b buffer-name] [-E end-line] [-S start-line] [-t target-pane]',
  'choose-buffer [-NrZ] [-F format] [-f filter] [-K key-format] [-O sort-order] [-t target-pane] [template]',
  'choose-client [-NrZ] [-F format] [-f filter] [-K key-format] [-O sort-order] [-t target-pane] [template]',
  'choose-tree [-GNrswZ] [-F format] [-f filter] [-K key-format] [-O sort-order] [-t target-pane] [template]',
  'clear-history (clearhist) [-H] [-t target-pane]',
  'clear-prompt-history (clearphist) [-T type]',
  'clock-mode [-t target-pane]',
  'command-prompt [-1bFkiN] [-I inputs] [-p prompts] [-t target-client] [-T type] [template]',
  'confirm-before (confirm) [-by] [-c confirm_key] [-p prompt] [-t target-client] command',
  'copy-mode [-deHMuq] [-s src-pane] [-t target-pane]',
  'customize-mode [-NZ] [-F format] [-f filter] [-t target-pane]',
  'delete-buffer (deleteb) [-b buffer-name]',
  'detach-client (detach) [-aP] [-E shell-command] [-s target-session] [-t target-client]',
  'display-menu (menu) [-MO] [-b border-lines] [-c target-client] [-C starting-choice] [-H selected-style] [-s style] [-S border-style] [-t target-pane][-T title] [-x position] [-y position] name key command ...',
  'display-message (display) [-aIlNpv] [-c target-client] [-d delay] [-F format] [-t target-pane] [message]',
  'display-popup (popup) [-BCE] [-b border-lines] [-c target-client] [-d start-directory] [-e environment] [-h height] [-s style] [-S border-style] [-t target-pane][-T title] [-w width] [-x position] [-y position] [shell-command]',
  'display-panes (displayp) [-bN] [-d duration] [-t target-client] [template]',
  'find-window (findw) [-CiNrTZ] [-t target-pane] match-string',
  'has-session (has) [-t target-session]',
  'if-shell (if) [-bF] [-t target-pane] shell-command command [command]',
  'join-pane (joinp) [-bdfhv] [-l size] [-s src-pane] [-t dst-pane]',
  'kill-pane (killp) [-a] [-t target-pane]',
  'kill-server',
  'kill-session [-aC] [-t target-session]',
  'kill-window (killw) [-a] [-t target-window]',
  'last-pane (lastp) [-deZ] [-t target-window]',
  'last-window (last) [-t target-session]',
  'link-window (linkw) [-abdk] [-s src-window] [-t dst-window]',
  'list-buffers (lsb) [-F format] [-f filter]',
  'list-clients (lsc) [-F format] [-f filter] [-t target-session]',
  'list-commands (lscm) [-F format] [command]',
  'list-keys (lsk) [-1aN] [-P prefix-string] [-T key-table] [key]',
  'list-panes (lsp) [-as] [-F format] [-f filter] [-t target-window]',
  'list-sessions (ls) [-F format] [-f filter]',
  'list-windows (lsw) [-a] [-F format] [-f filter] [-t target-session]',
  'load-buffer (loadb) [-b buffer-name] [-t target-client] path',
  'lock-client (lockc) [-t target-client]',
  'lock-server (lock)',
  'lock-session (locks) [-t target-session]',
  'move-pane (movep) [-bdfhv] [-l size] [-s src-pane] [-t dst-pane]',
  'move-window (movew) [-abdkr] [-s src-window] [-t dst-window]',
  'new-session (new) [-AdDEPX] [-c start-directory] [-e environment] [-F format] [-f flags] [-n window-name] [-s session-name] [-t target-session] [-x width] [-y height] [shell-command]',
  'new-window (neww) [-abdkPS] [-c start-directory] [-e environment] [-F format] [-n window-name] [-t target-window] [shell-command]',
  'next-layout (nextl) [-t target-window]',
  'next-window (next) [-a] [-t target-session]',
  'paste-buffer (pasteb) [-dpr] [-s separator] [-b buffer-name] [-t target-pane]',
  'pipe-pane (pipep) [-IOo] [-t target-pane] [shell-command]',
  'previous-layout (prevl) [-t target-window]',
  'previous-window (prev) [-a] [-t target-session]',
  'refresh-client (refresh) [-cDlLRSU] [-A pane:state] [-B name:what:format] [-C XxY] [-f flags] [-r pane:report][-t target-client] [adjustment]',
  'rename-session (rename) [-t target-session] new-name',
  'rename-window (renamew) [-t target-window] new-name',
  'resize-pane (resizep) [-DLMRTUZ] [-x width] [-y height] [-t target-pane] [adjustment]',
  'resize-window (resizew) [-aADLRU] [-x width] [-y height] [-t target-window] [adjustment]',
  'respawn-pane (respawnp) [-k] [-c start-directory] [-e environment] [-t target-pane] [shell-command]',
  'respawn-window (respawnw) [-k] [-c start-directory] [-e environment] [-t target-window] [shell-command]',
  'rotate-window (rotatew) [-DUZ] [-t target-window]',
  'run-shell (run) [-bC] [-c start-directory] [-d delay] [-t target-pane] [shell-command]',
  'save-buffer (saveb) [-a] [-b buffer-name] path',
  'select-layout (selectl) [-Enop] [-t target-pane] [layout-name]',
  'select-pane (selectp) [-DdeLlMmRUZ] [-T title] [-t target-pane]',
  'select-window (selectw) [-lnpT] [-t target-window]',
  'send-keys (send) [-FHKlMRX] [-c target-client] [-N repeat-count] [-t target-pane] key ...',
  'send-prefix [-2] [-t target-pane]',
  'server-access [-adlrw] [-t target-pane] [user]',
  'set-buffer (setb) [-aw] [-b buffer-name] [-n new-buffer-name] [-t target-client] data',
  'set-environment (setenv) [-Fhgru] [-t target-session] name [value]',
  'set-hook [-agpRuw] [-t target-pane] hook [command]',
  'set-option (set) [-aFgopqsuUw] [-t target-pane] option [value]',
  'set-window-option (setw) [-aFgoqu] [-t target-window] option [value]',
  'show-buffer (showb) [-b buffer-name]',
  'show-environment (showenv) [-hgs] [-t target-session] [name]',
  'show-hooks [-gpw] [-t target-pane]',
  'show-messages (showmsgs) [-JT] [-t target-client]',
  'show-options (show) [-AgHpqsvw] [-t target-pane] [option]',
  'show-prompt-history (showphist) [-T type]',
  'show-window-options (showw) [-gv] [-t target-window] [option]',
  'source-file (source) [-Fnqv] [-t target-pane] path ...',
  'split-window (splitw) [-bdefhIPvZ] [-c start-directory] [-e environment] [-F format] [-l size] [-t target-pane][shell-command]',
  'start-server (start)',
  'suspend-client (suspendc) [-t target-client]',
  'swap-pane (swapp) [-dDUZ] [-s src-pane] [-t dst-pane]',
  'swap-window (swapw) [-d] [-s src-window] [-t dst-window]',
  'switch-client (switchc) [-ElnprZ] [-c target-client] [-t target-session] [-T key-table]',
  'unbind-key (unbind) [-anq] [-T key-table] key',
  'unlink-window (unlinkw) [-k] [-t target-window]',
  'wait-for (wait) [-L|-S|-U] channel',
];

function parseTmuxCommandSpec(spec) {
  // Separate the command name and alias
  const nameAliasMatch = spec.match(/^(\S+)(?: \((\S+)\))?/);
  if (!nameAliasMatch) {
    throw new Error(`Could not parse command name/alias from: "${spec}"`);
  }

  const name = nameAliasMatch[1];
  const alias = nameAliasMatch[2] || undefined;

  // Capture all "[-...]" and "[-x param]" blocks
  const flagBlockRegex = /\[-([a-zA-Z]+)\]/g;
  const optionBlockRegex = /\[-(\w)\s+([^\]]+)\]/g;
  const allBlocks = [...spec.matchAll(/\[[^\]]+\]/g)];

  const flags = [];
  const options = [];

  for (const block of allBlocks) {
    const text = block[0];
    // Check if it's a group of flags: [-aCeJNpPqT]
    const flagMatch = text.match(/^\[-([a-zA-Z]+)\]$/);
    if (flagMatch) {
      flags.push(...flagMatch[1].split('').map(f => `-${f}`));
      continue;
    }

    // Check if it's an option: [-t target-pane]
    const optionMatch = text.match(/^\[-(\w)\s+[^\]]+\]$/);
    if (optionMatch) {
      options.push(`-${optionMatch[1]}`);
    }
  }

  // Positional args (non-option square brackets)
  const argMatches = [...spec.matchAll(/\[([^\[\]-]+?)\]/g)];
  const args = argMatches
    .map(match => match[1].trim())
    .filter(arg => !arg.includes(' ')); // crude way to avoid re-adding option descriptions

  return {
    [name]: {
      alias,
      flags,
      options,
      args
    }
  };
}

const input = tmuxCommands.find(cmd => cmd.startsWith('set-window-option'));
console.log(JSON.stringify(parseTmuxCommandSpec(input), null, 2));
