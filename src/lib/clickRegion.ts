import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type CardRegion = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ClickPanelLayout = {
  paneId: string;
  paneWidth: number;
  paneHeight: number;
  cards: CardRegion[];
};

export type HitTestResult =
  | { kind: 'card'; name: string }
  | { kind: 'empty' }
  | { kind: 'stale' };

export function getLayoutPath(paneId: string): string {
  const sanitized = paneId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(os.tmpdir(), `montra-overview-${sanitized}.json`);
}

export async function writeLayout(layout: ClickPanelLayout): Promise<void> {
  await fs.writeFile(
    getLayoutPath(layout.paneId),
    JSON.stringify(layout),
    'utf8',
  );
}

export async function readLayout(
  paneId: string,
): Promise<ClickPanelLayout | null> {
  try {
    const raw = await fs.readFile(getLayoutPath(paneId), 'utf8');
    return JSON.parse(raw) as ClickPanelLayout;
  } catch {
    return null;
  }
}

export async function deleteLayout(paneId: string): Promise<void> {
  await fs.unlink(getLayoutPath(paneId)).catch(() => {});
}

export function hitTest(
  layout: ClickPanelLayout,
  x: number,
  y: number,
  currentSize: { width: number; height: number },
): HitTestResult {
  if (
    layout.paneWidth !== currentSize.width ||
    layout.paneHeight !== currentSize.height
  ) {
    return { kind: 'stale' };
  }

  for (const card of layout.cards) {
    if (
      x >= card.x &&
      x < card.x + card.w &&
      y >= card.y &&
      y < card.y + card.h
    ) {
      return { kind: 'card', name: card.name };
    }
  }

  return { kind: 'empty' };
}
