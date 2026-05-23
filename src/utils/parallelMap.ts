/**
 * Maps `items` through `mapper` with at most `limit` invocations in flight at
 * a time. Order of results matches order of input. Use this instead of
 * `Promise.all(items.map(...))` when each invocation is expensive (subprocess
 * spawn, network call, etc.) and a flood of parallel calls would overwhelm
 * the system.
 */
export async function parallelMap<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}
