export const PING_HISTORY_SIZE = 24;

export type PingSummary = {
  latest: number | null;
  best: number | null;
  worst: number | null;
  average: number | null;
  jitter: number | null;
};

export function addPing(list: number[], value: number, size = PING_HISTORY_SIZE): number[] {
  if (!Number.isFinite(value) || value < 0) {
    return list;
  }
  return [...list, Math.round(value)].slice(-size);
}

export function summarizePings(list: number[]): PingSummary {
  if (list.length === 0) {
    return { latest: null, best: null, worst: null, average: null, jitter: null };
  }
  const average = list.reduce((sum, value) => sum + value, 0) / list.length;
  let jitter = 0;
  for (let index = 1; index < list.length; index += 1) {
    jitter += Math.abs(list[index] - list[index - 1]);
  }
  return {
    latest: list[list.length - 1],
    best: Math.min(...list),
    worst: Math.max(...list),
    average: Math.round(average),
    jitter: list.length > 1 ? Math.round(jitter / (list.length - 1)) : 0,
  };
}
