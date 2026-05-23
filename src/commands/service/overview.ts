import { Command } from '@commander-js/extra-typings';

import store, { Runtime, Service, ServiceType } from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import {
  BoxOptions,
  ChalkColor,
  createBox,
  printBoxes,
} from '../../lib/box.js';
import {
  getServiceStatusBulk,
  ServiceStatus,
} from '../../lib/serviceStatus.js';
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

type CardState = {
  name: string;
  alias?: string;
  type: ServiceType;
  runtime: Runtime;
  info?: ServiceInfo;
  status?: ServiceStatus;
};

type Teardown = () => Promise<void>;

let activeRefresh: { cancelled: boolean } | null = null;

export async function overview(opts: { refreshInterval?: string }) {
  const refreshSeconds =
    Number(opts.refreshInterval) || DEFAULT_REFRESH_SECONDS;
  const refreshMs = refreshSeconds * 1000;

  const paneId = process.env.TMUX_PANE ?? null;
  if (paneId !== null) {
    const teardown = await setupClickIntegration(paneId);
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
  if (activeRefresh) activeRefresh.cancelled = true;
  const me = { cancelled: false };
  activeRefresh = me;

  const services = store.get('services') ?? [];
  if (services.length === 0) {
    console.clear();
    return;
  }

  const cards = initialCardStates(services);
  await paintIfActive(cards, paneId, me);

  const infoFetch = fetchAllInfo(services, cards).then(() =>
    paintIfActive(cards, paneId, me),
  );

  const statusFetch = getServiceStatusBulk(services.map((s) => s.name))
    .then((statuses) => {
      for (const [name, status] of statuses) {
        const card = cards.get(name);
        if (card) card.status = status;
      }
    })
    .then(() => paintIfActive(cards, paneId, me));

  await Promise.all([infoFetch, statusFetch]);
}

function initialCardStates(services: Service[]): Map<string, CardState> {
  const map = new Map<string, CardState>();
  for (const s of services) {
    map.set(s.name, {
      name: s.name,
      alias: s.alias,
      type: s.type,
      runtime: s.runtime,
    });
  }
  return map;
}

async function fetchAllInfo(
  services: Service[],
  cards: Map<string, CardState>,
): Promise<void> {
  await Promise.all(
    services.map(async (service) => {
      try {
        const info = await getServiceInfo({
          serviceName: service.name,
          status: false,
        });
        const card = cards.get(service.name);
        if (card) card.info = info;
      } catch {
        /* leave card without info — placeholder stays visible */
      }
    }),
  );
}

async function paintIfActive(
  cards: Map<string, CardState>,
  paneId: string | null,
  refresh: { cancelled: boolean },
): Promise<void> {
  if (refresh.cancelled) return;
  await paint(cards, paneId);
}

async function paint(
  cards: Map<string, CardState>,
  paneId: string | null,
): Promise<void> {
  const sorted = [...cards.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const grouped = groupByType(sorted);

  console.clear();

  if (paneId === null) {
    for (const groupCards of Object.values(grouped)) {
      console.log('');
      renderGroupSimple(groupCards);
    }
    return;
  }

  const { output, cards: regions } = renderOverview(grouped);
  console.log(output);

  const size = await getPaneSize(paneId);
  if (size) {
    await writeLayout({
      paneId,
      paneWidth: size.width,
      paneHeight: size.height,
      cards: regions,
    });
  }
}

function groupByType(
  cards: CardState[],
): Record<ServiceType, CardState[]> {
  return cards.reduce(
    (groups, card) => {
      groups[card.type] = [...(groups[card.type] ?? []), card];
      return groups;
    },
    {} as Record<ServiceType, CardState[]>,
  );
}

function cardToBoxOptions(card: CardState): BoxOptions {
  const description = card.info?.description ?? '⏳ Fetching info…';
  const version = card.info?.version ?? '…';
  const branch = card.info?.branch ?? '…';

  return {
    title: `${serviceTypeIconMap[card.type]} ${card.name}`,
    titlePosition: 'topLeft',
    text: `${description}\nruntime: ${card.runtime}\nversion: ${version}\nbranch: ${branch}`,
    borderColor: borderColorForCard(card),
    textColor: 'white',
    width: BOX_WIDTH,
  };
}

function borderColorForCard(card: CardState): ChalkColor {
  if (!card.status) return 'gray';
  return serviceStatusColorMap[card.status];
}

function renderGroupSimple(cards: CardState[]) {
  const boxes = cards.map(cardToBoxOptions);
  for (const chunk of chunkArray(boxes, BOXES_PER_ROW)) {
    printBoxes({ distanceBetween: BOX_DISTANCE, boxes: chunk });
  }
}

function renderOverview(grouped: Record<string, CardState[]>): {
  output: string;
  cards: CardRegion[];
} {
  const lines: string[] = [];
  const regions: CardRegion[] = [];

  for (const groupCards of Object.values(grouped)) {
    lines.push('');

    const boxes = groupCards.map(cardToBoxOptions);
    const chunkedBoxes = chunkArray(boxes, BOXES_PER_ROW);
    const chunkedCards = chunkArray(groupCards, BOXES_PER_ROW);

    for (let chunkIdx = 0; chunkIdx < chunkedBoxes.length; chunkIdx++) {
      const chunkBoxes = chunkedBoxes[chunkIdx];
      const chunkCards = chunkedCards[chunkIdx];

      const renderedBoxes = chunkBoxes.map((opts) =>
        createBox(opts).split('\n'),
      );
      const maxHeight = Math.max(...renderedBoxes.map((l) => l.length));
      const chunkY = lines.length;

      chunkCards.forEach((card, i) => {
        regions.push({
          name: card.name,
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

  return { output: lines.join('\n'), cards: regions };
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
