import { Command } from '@commander-js/extra-typings';

import { withErrorHandler } from '../../utils/errorHandler.js';
import { readLayout, hitTest } from '../../lib/clickRegion.js';
import { displayMenu, MenuItem } from '../../lib/tmux/menu.js';
import { buildTmuxCommand, execTmux } from '../../lib/tmux/execTmux.js';
import { escapeShellArg } from '../../utils/shell.js';

const POPUP_WIDTH = '80%';
const POPUP_HEIGHT = '70%';

function monExecutable(): string {
  return `${process.argv[0]} ${process.argv[1]}`;
}

function popupItem(label: string, key: string, monArgs: string): MenuItem {
  const shellCommand = `${monExecutable()} ${monArgs}`;
  return {
    type: 'item',
    label,
    key,
    command: `display-popup -E -w ${POPUP_WIDTH} -h ${POPUP_HEIGHT} ${escapeShellArg(shellCommand)}`,
  };
}

async function flashStaleMessage(): Promise<void> {
  const cmd = buildTmuxCommand(
    'display-message',
    { '-d': '3000' },
    [],
    [escapeShellArg('overview resized — wait for next refresh')],
  );
  await execTmux(cmd);
}

async function action(
  rawX: string,
  rawY: string,
  paneId: string,
  rawPaneWidth: string,
  rawPaneHeight: string,
): Promise<void> {
  const x = Number(rawX);
  const y = Number(rawY);
  const paneWidth = Number(rawPaneWidth);
  const paneHeight = Number(rawPaneHeight);

  if ([x, y, paneWidth, paneHeight].some((n) => !Number.isFinite(n))) {
    throw new Error('Invalid arguments to overview-click');
  }

  const layout = await readLayout(paneId);
  if (!layout) return;

  const hit = hitTest(layout, x, y, { width: paneWidth, height: paneHeight });

  if (hit.kind === 'stale') {
    await flashStaleMessage();
    return;
  }

  const position = {
    kind: 'paneRelative' as const,
    x,
    y,
    targetPane: paneId,
  };

  if (hit.kind === 'empty') {
    await displayMenu({
      title: ' empty ',
      items: [
        popupItem('Add new service', 'a', 'service add'),
        { type: 'separator' },
        { type: 'item', label: 'Cancel', key: 'q', command: '' },
      ],
      position,
      persistOnMouseRelease: true,
    });
    return;
  }

  const name = hit.name;
  await displayMenu({
    title: ` ${name} `,
    items: [
      popupItem('Start', 's', `service start ${name}`),
      popupItem('Stop', 'x', `service stop ${name}`),
      popupItem('Restart', 'r', `service restart ${name}`),
      { type: 'separator' },
      popupItem('Modify', 'm', `service modify ${name}`),
      { type: 'separator' },
      { type: 'item', label: 'Cancel', key: 'q', command: '' },
    ],
    position,
    persistOnMouseRelease: true,
  });
}

export default new Command('_overview-click')
  .description('internal: handle a click event for service overview')
  .argument('<x>')
  .argument('<y>')
  .argument('<pane>')
  .argument('<paneWidth>')
  .argument('<paneHeight>')
  .action(withErrorHandler(action));
