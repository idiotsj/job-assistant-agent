export function uniqueBy<T>(items: T[], selector: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = selector(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function overlapCount(left: string[] = [], right: string[] = []) {
  const set = new Set(right.map((item) => item.toLowerCase()));
  return left.filter((item) => set.has(item.toLowerCase())).length;
}

export function daysUntil(date: string | null | undefined, now = new Date()) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export function isWithinDays(date: string | null | undefined, threshold: number, now = new Date()) {
  const diff = daysUntil(date, now);
  return diff >= 0 && diff <= threshold;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ensureArray(value: string | string[] | undefined) {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

