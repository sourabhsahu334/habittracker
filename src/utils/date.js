// Date helpers. Days are identified by a local "YYYY-MM-DD" key so that all
// grouping/streak logic is timezone-stable and independent of clock time.

export function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysBetween(aKey, bKey) {
  // Whole days from a -> b (b - a). Positive if b is later.
  const a = parseDayKey(aKey);
  const b = parseDayKey(bKey);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function daysUntil(targetKey, fromKey = dayKey()) {
  return daysBetween(fromKey, targetKey);
}

// Monday as start of week (Feature 8).
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function weekDayKeys(date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, i)));
}

export function monthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isInMonth(dKey, mKey) {
  return dKey.slice(0, 7) === mKey;
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function prettyMonth(mKey) {
  const [y, m] = mKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function prettyDate(dKey) {
  const d = parseDayKey(dKey);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
