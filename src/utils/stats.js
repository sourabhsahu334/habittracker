// Pure functions that derive all dashboard/progress metrics from the raw
// entry list. Keeping these pure makes them trivial to reason about and reuse
// across screens, and they recompute correctly after any edit/delete.

import { addDays, dayKey, daysBetween, isInMonth, parseDayKey, weekDayKeys } from './date';

// Group entries by their dateKey -> { [dateKey]: Entry[] }
export function groupByDate(entries) {
  const map = {};
  for (const e of entries) {
    (map[e.dateKey] = map[e.dateKey] || []).push(e);
  }
  return map;
}

// Sorted (newest first) list of distinct day keys that have >=1 entry.
export function loggedDayKeys(entries) {
  return Object.keys(groupByDate(entries)).sort((a, b) => (a < b ? 1 : -1));
}

export function totalHoursForDay(entries, dKey) {
  return entries
    .filter(e => e.dateKey === dKey)
    .reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
}

// Current streak: consecutive days up to today (or yesterday if today is
// empty) with at least one entry (Feature 4).
export function currentStreak(entries, todayKey = dayKey()) {
  const logged = new Set(Object.keys(groupByDate(entries)));
  if (logged.size === 0) return 0;

  let cursor = todayKey;
  // Allow the streak to be "alive" if today isn't logged yet but yesterday is.
  if (!logged.has(cursor)) {
    cursor = dayKey(addDays(parseDayKey(todayKey), -1));
    if (!logged.has(cursor)) return 0;
  }

  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = dayKey(addDays(parseDayKey(cursor), -1));
  }
  return streak;
}

// Longest consecutive run ever (Feature 17).
export function bestStreak(entries) {
  const keys = Object.keys(groupByDate(entries)).sort();
  if (keys.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    if (daysBetween(keys[i - 1], keys[i]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

// Per-subject aggregation (Features 7, 12, 18).
export function subjectTotals(entries) {
  const map = {};
  for (const e of entries) {
    const s = (map[e.subject] = map[e.subject] || {
      subject: e.subject,
      hours: 0,
      questions: 0,
      correct: 0,
      hasAccuracy: false,
    });
    s.hours += Number(e.hours) || 0;
    s.questions += Number(e.questions) || 0;
    if (e.correct != null && e.correct !== '') {
      s.correct += Number(e.correct) || 0;
      s.hasAccuracy = true;
    }
  }
  return Object.values(map).sort((a, b) => b.hours - a.hours);
}

// Subjects studied far less than the leader (Feature 12).
// A subject is "weak" if its hours are < threshold * max subject hours.
export function weakSubjects(entries, threshold = 0.2) {
  const totals = subjectTotals(entries);
  if (totals.length < 2) return [];
  const max = totals[0].hours;
  if (max <= 0) return [];
  return totals.filter(t => t.hours < threshold * max).map(t => t.subject);
}

export function accuracy(correct, solved) {
  if (!solved || solved <= 0) return null;
  return Math.round((correct / solved) * 100);
}

// Totals + per-day hours for the current week (Feature 8).
export function weekStats(entries, refDate = new Date()) {
  const keys = weekDayKeys(refDate);
  const byDate = groupByDate(entries);
  const perDay = keys.map(k => {
    const list = byDate[k] || [];
    return {
      dateKey: k,
      hours: list.reduce((s, e) => s + (Number(e.hours) || 0), 0),
      questions: list.reduce((s, e) => s + (Number(e.questions) || 0), 0),
    };
  });
  return {
    perDay,
    totalHours: perDay.reduce((s, d) => s + d.hours, 0),
    totalQuestions: perDay.reduce((s, d) => s + d.questions, 0),
  };
}

// Monthly summary (Feature 16).
export function monthStats(entries, mKey) {
  const inMonth = entries.filter(e => isInMonth(e.dateKey, mKey));
  const byDate = groupByDate(inMonth);
  const dayKeys = Object.keys(byDate);
  return {
    totalHours: inMonth.reduce((s, e) => s + (Number(e.hours) || 0), 0),
    totalQuestions: inMonth.reduce((s, e) => s + (Number(e.questions) || 0), 0),
    daysStudied: dayKeys.length,
    bestStreak: bestStreak(inMonth),
    subjects: subjectTotals(inMonth),
    byDate,
  };
}
