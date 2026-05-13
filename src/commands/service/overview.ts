import { Command } from '@commander-js/extra-typings';
import ora from 'ora';

import store, { ServiceType } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import {
  BoxOptions,
  ChalkColor,
  createBox,
  printBoxes,
} from '../../lib/box.js';
import { ServiceStatus } from './status.js';
import { chunkArray } from '../../utils/prettyPrintKeyValue.js';
import { getServiceInfo, ServiceInfo } from './info.js';
import {
  CardRegion,
  deleteLayout,
  writeLayout,
} from '../../lib/clickRegion.js';
import {
  captureBinding,
  installBinding,
  restoreBinding,
} from '../../lib/tmux/binding.js';
import { buildTmuxCommand, execTmux } from '../../lib/tmux/execTmux.js';

const BOX_WIDTH = 50;
const BOX_DISTANCE = 5;
const BOXES_PER_ROW = 4;
const DEFAULT_REFRESH_SECONDS = 30;
const BINDING = { table: 'root', key: 'DoubleClick1Pane' } as const;

const serviceStatusColorMap: Record<ServiceStatus, ChalkColor> = {
  RUNNING: 'green',
  SESSION_EXISTS: 'yellow',
  STOPPED: 'red',
};

const serviceTypeIconMap: Record<ServiceType, string> = {
  backend_service: '⚙️',
  frontend_service: '💻',
  docker_compose_service: '🐳',
  lambda: 'λ',
};

type Teardown = () => Promise<void>;

export async function overview(opts: { refreshInterval?: string }) {
  const refreshSeconds =
    Number(opts.refreshInterval) || DEFAULT_REFRESH_SECONDS;
  const refreshMs = refreshSeconds * 1000;

  const paneId = process.env.TMUX_PANE ?? null;
  const interactive = paneId !== null;

  let teardown: Teardown = async () => {};
  if (interactive) {
    teardown = await setupClickIntegration(paneId);
    registerExitHandlers(teardown);
  }

  console.clear();
  await refresh(paneId);
  setInterval(() => {
    refresh(paneId).catch(() => {
      /* swallow refresh errors so the loop keeps running */
    });
  }, refreshMs);
}

async function refresh(paneId: string | null): Promise<void> {
  const spinner = ora('Fetching service info...').start();

  const services = store.get('services') ?? [];
  const serviceInfos = await Promise.all(
    services.map((service) =>
      getServiceInfo({ serviceName: service.name, status: true }),
    ),
  );

  const sorted = serviceInfos.sort((a, b) =>
    a.service.localeCompare(b.service),
  );
  const grouped = sorted.reduce(
    (groups, service) => {
      groups[service.type] = [...(groups[service.type] ?? []), service];
      return groups;
    },
    {} as Record<ServiceType, ServiceInfo[]>,
  );

  spinner.clear();
  console.clear();

  if (paneId === null) {
    for (const services of Object.values(grouped)) {
      console.log('');
      renderGroupSimple(services);
    }
    return;
  }

  const { output, cards } = renderOverview(grouped);
  console.log(output);

  const size = await getPaneSize(paneId);
  if (size) {
    await writeLayout({
      paneId,
      paneWidth: size.width,
      paneHeight: size.height,
      cards,
    });
  }
}

function serviceToBoxOptions(service: ServiceInfo): BoxOptions {
  return {
    title: `${serviceTypeIconMap[service.type]} ${service.service}`,
    titlePosition: 'topLeft',
    text: `${service.description}\nruntime: ${service.runtime}\nversion: ${service.version}\nbranch: ${service.branch}`,
    borderColor: service.status
      ? serviceStatusColorMap[service.status]
      : 'white',
    textColor: 'white',
    width: BOX_WIDTH,
  };
}

function renderGroupSimple(services: ServiceInfo[]) {
  const boxes = services.map(serviceToBoxOptions);
  for (const chunk of chunkArray(boxes, BOXES_PER_ROW)) {
    printBoxes({ distanceBetween: BOX_DISTANCE, boxes: chunk });
  }
}

function renderOverview(grouped: Record<string, ServiceInfo[]>): {
  output: string;
  cards: CardRegion[];
} {
  const lines: string[] = [];
  const cards: CardRegion[] = [];

  for (const services of Object.values(grouped)) {
    lines.push('');

    const boxes = services.map(serviceToBoxOptions);
    const chunkedBoxes = chunkArray(boxes, BOXES_PER_ROW);
    const chunkedServices = chunkArray(services, BOXES_PER_ROW);

    for (let chunkIdx = 0; chunkIdx < chunkedBoxes.length; chunkIdx++) {
      const chunkBoxes = chunkedBoxes[chunkIdx];
      const chunkServices = chunkedServices[chunkIdx];

      const renderedBoxes = chunkBoxes.map((opts) =>
        createBox(opts).split('\n'),
      );
      const maxHeight = Math.max(...renderedBoxes.map((l) => l.length));
      const chunkY = lines.length;

      chunkServices.forEach((service, i) => {
        cards.push({
          name: service.service,
          x: i * (BOX_WIDTH + BOX_DISTANCE),
          y: chunkY,
          w: BOX_WIDTH,
          h: maxHeight,
        });
      });

      const padded = renderedBoxes.map((boxLines, i) => {
        const out = [...boxLines];
        const w = chunkBoxes[i].width ?? BOX_WIDTH;
        while (out.length < maxHeight) out.push(' '.repeat(w));
        return out;
      });

      const sep = ' '.repeat(BOX_DISTANCE);
      for (let row = 0; row < maxHeight; row++) {
        lines.push(padded.map((box) => box[row]).join(sep));
      }
    }
  }

  return { output: lines.join('\n'), cards };
}

async function setupClickIntegration(paneId: string): Promise<Teardown> {
  const restoreMouse = await ensureMouseOn();

  const captured = await captureBinding(BINDING);
  const capturedLine = captured.success ? captured.data : null;

  const monExec = `${process.argv[0]} ${process.argv[1]}`;
  const handler =
    `if -F '#{==:#{pane_id},${paneId}}' ` +
    `'run-shell -b "${monExec} _overview-click ` +
    `#{mouse_x} #{mouse_y} #{pane_id} #{pane_width} #{pane_height}"' ` +
    `''`;

  const installResult = await installBinding(BINDING, handler);
  if (!installResult.success) {
    if (restoreMouse) await restoreMouse();
    throw new Error(
      `Failed to install click binding: ${installResult.error.error.message}`,
    );
  }

  await installPaneDiedHook(paneId, capturedLine);

  return async () => {
    await removePaneDiedHook(paneId);
    await restoreBinding(BINDING, capturedLine);
    await deleteLayout(paneId);
    if (restoreMouse) await restoreMouse();
  };
}

/**
 * Ensures `mouse on` is set globally. Returns a function to restore the
 * prior value if we changed it; or `null` if it was already on.
 */
async function ensureMouseOn(): Promise<Teardown | null> {
  const showResult = await execTmux(
    buildTmuxCommand('show-options', {}, ['-g', '-v'], ['mouse']),
  );

  const current = showResult.success ? showResult.stdout.trim() : '';
  if (current === 'on') return null;

  await execTmux(
    buildTmuxCommand('set-option', {}, ['-g'], ['mouse', 'on']),
  );

  return async () => {
    await execTmux(
      buildTmuxCommand(
        'set-option',
        {},
        ['-g'],
        ['mouse', current || 'off'],
      ),
    );
  };
}

/**
 * Backstop: if overview dies ungracefully, this hook restores the binding
 * and removes the layout file when the pane is closed.
 */
async function installPaneDiedHook(
  paneId: string,
  capturedLine: string | null,
): Promise<void> {
  const restoreCmd = capturedLine
    ? `unbind-key -T ${BINDING.table} ${BINDING.key} ; ${capturedLine}`
    : `unbind-key -T ${BINDING.table} ${BINDING.key}`;
  await execTmux(
    buildTmuxCommand(
      'set-hook',
      { '-t': paneId },
      ['-p'],
      ['pane-died', `'${restoreCmd.replace(/'/g, "'\\''")}'`],
    ),
  );
}

async function removePaneDiedHook(paneId: string): Promise<void> {
  await execTmux(
    buildTmuxCommand('set-hook', { '-t': paneId }, ['-p', '-u'], ['pane-died']),
  );
}

async function getPaneSize(
  paneId: string,
): Promise<{ width: number; height: number } | null> {
  const result = await execTmux(
    buildTmuxCommand(
      'display-message',
      { '-t': paneId },
      ['-p'],
      [`'#{pane_width} #{pane_height}'`],
    ),
  );
  if (!result.success) return null;
  const [w, h] = result.stdout.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { width: w, height: h };
}

function registerExitHandlers(teardown: Teardown) {
  let teardownStarted = false;
  const handle = async () => {
    if (teardownStarted) return;
    teardownStarted = true;
    await teardown();
    process.exit(0);
  };
  process.on('SIGINT', handle);
  process.on('SIGTERM', handle);
}

export default new Command('overview')
  .alias('ov')
  .description('Print an overview of all services')
  .option(
    '-r, --refresh-interval <seconds>',
    'how often to refresh the overview',
    String(DEFAULT_REFRESH_SECONDS),
  )
  .action(withErrorHandler(overview));
