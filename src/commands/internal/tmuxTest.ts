import { Command } from '@commander-js/extra-typings';
import * as tmux from '../../lib/tmux/tmux.js';

const listSessions = new Command('listSessions').action(async () => {
  const result = await tmux.listSessions();

  if (!result.success) {
    console.error(result.error.error.message);
    return;
  }

  console.log(result.data);
});

const newSessions = new Command('newSession')
  .argument('<string>', 'name')
  .option('-c, --command <string>', 'optional command')
  .action(async (name, options) => {
    const result = await tmux.newSession({
      sessionName: name,
      command: options.command,
    });

    if (!result.success) {
      console.error(result.error.error.message);
      return;
    }

    console.log(result.data);
  });

const killSession = new Command('killSession')
  .argument('<string>', 'session')
  .action(async (session) => {
    const result = await tmux.killSession(session);

    if (!result.success) {
      console.error(result.error.error.message);
      return;
    }

    console.log(result.data);
  });

const newWindow = new Command('newWindow')
  .argument('<string>', 'session')
  .argument('<string>', 'window')
  .argument('<string>', 'entrypoint')
  .argument('<string>', 'command')
  .action(async (session, window, entrypoint, command) => {
    const result = await tmux.newWindow({
      sessionName: session,
      windowName: window,
      entrypoint,
      command,
    });

    if (!result.success) {
      console.error(result.error.error.message);
      return;
    }

    console.log(result.data);
  });

const listWindows = new Command('listWindows')
  .argument('<string>', 'session')
  .action(async (session) => {
    const result = await tmux.listWindows(session);

    if (!result.success) {
      console.error(result.error.error.message);
      return;
    }

    console.log(result.data);
  });

const killWindow = new Command('killWindow')
  .argument('<string>', 'session')
  .argument('<string>', 'window')
  .action(async (session, window) => {
    const result = await tmux.killWindow({
      sessionName: session,
      windowName: window,
    });

    if (!result.success) {
      console.error(result.error.error.message);
      return;
    }

    console.log(result.data);
  });

const capturePane = new Command('capturePane')
  .argument('<string>', 'session')
  .argument('<string>', 'window')
  .action(async (session, window) => {
    const cmd = tmux.buildTmuxCommand(
      'capture-pane',
      { '-t': `${session}:${window}` },
      ['-p'],
    );
    const result = await tmux.execTmux(cmd);

    if (result.success) {
      console.log(result.stdout);
    } else {
      console.error(result.error.error.message);
    }
  });

export default new Command('tmux')
  .description('Test command for tmux library')
  .addCommand(listSessions)
  .addCommand(newSessions)
  .addCommand(killSession)
  .addCommand(newWindow)
  .addCommand(listWindows)
  .addCommand(killWindow)
  .addCommand(capturePane);
