/**
 * Unit tests for the pure stat helpers — no native modules required.
 *
 * @format
 */

import {
  bestStreak,
  currentStreak,
  subjectTotals,
  weakSubjects,
  weekStats,
  accuracy,
} from '../src/utils/stats';

const e = (dateKey, subject, hours, questions, correct) => ({
  id: `${dateKey}-${subject}`,
  dateKey,
  subject,
  hours,
  questions,
  correct,
});

test('currentStreak counts consecutive days ending today', () => {
  const entries = [
    e('2026-07-05', 'Physics', 2, 10),
    e('2026-07-06', 'Physics', 2, 10),
    e('2026-07-07', 'Physics', 2, 10),
  ];
  expect(currentStreak(entries, '2026-07-07')).toBe(3);
});

test('currentStreak stays alive if today empty but yesterday logged', () => {
  const entries = [
    e('2026-07-05', 'Physics', 2, 10),
    e('2026-07-06', 'Physics', 2, 10),
  ];
  expect(currentStreak(entries, '2026-07-07')).toBe(2);
});

test('currentStreak is 0 when a gap breaks it', () => {
  const entries = [e('2026-07-01', 'Physics', 2, 10)];
  expect(currentStreak(entries, '2026-07-07')).toBe(0);
});

test('bestStreak finds the longest run ever', () => {
  const entries = [
    e('2026-06-01', 'P', 1, 0),
    e('2026-06-02', 'P', 1, 0),
    e('2026-06-03', 'P', 1, 0),
    e('2026-06-10', 'P', 1, 0),
  ];
  expect(bestStreak(entries)).toBe(3);
});

test('subjectTotals aggregates and sorts by hours desc', () => {
  const totals = subjectTotals([
    e('2026-07-01', 'Physics', 3, 10),
    e('2026-07-01', 'Chemistry', 1, 5),
    e('2026-07-02', 'Physics', 2, 8),
  ]);
  expect(totals[0].subject).toBe('Physics');
  expect(totals[0].hours).toBe(5);
  expect(totals[1].hours).toBe(1);
});

test('weakSubjects flags subjects under 20% of the leader', () => {
  const weak = weakSubjects([
    e('2026-07-01', 'Physics', 10, 0),
    e('2026-07-01', 'Chemistry', 1, 0),
  ]);
  expect(weak).toContain('Chemistry');
  expect(weak).not.toContain('Physics');
});

test('weekStats totals the current week', () => {
  const ref = new Date('2026-07-07T12:00:00'); // Tuesday
  const stats = weekStats([e('2026-07-06', 'P', 2, 5)], ref); // Monday
  expect(stats.totalHours).toBe(2);
  expect(stats.totalQuestions).toBe(5);
  expect(stats.perDay).toHaveLength(7);
});

test('accuracy returns null when nothing solved', () => {
  expect(accuracy(5, 0)).toBeNull();
  expect(accuracy(8, 10)).toBe(80);
});
