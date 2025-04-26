import { getServiceStatus } from './commands/service/status.js';
import store from './utils/store.js';
import { notify } from './utils/notify.js';

async function watcher() {
  // TODO: move startedServices to different config file
  const startedServices = store.get('startedServices');
  const runtime = store.get('runtime');

  console.log(
    `[${new Date().toISOString()}] 👀 watching started services: `,
    startedServices.map((s) => s.service.name).join(', '),
  );

  const now = Date.now();

  const remaining: typeof startedServices = [];

  for (const { service, startedAt } of startedServices) {
    const expected =
      (service.expectedSecondsToStart ?? 10) * (runtime === 'docker' ? 3 : 1);
    const isExpired = now > startedAt + expected * 1000;

    if (!isExpired) {
      remaining.push({ service, startedAt });
      continue;
    }

    const status = await getServiceStatus(service.name);

    if (status !== 'RUNNING') {
      await notify(`⚠️ ${service.name} possibly failed to start.`);
    }
  }

  if (remaining.length !== startedServices.length) {
    store.set('startedServices', remaining);
  }
}

console.log(
  '🔁 Watcher started. Monitoring recently started services status...',
);

setInterval(watcher, 5000);
