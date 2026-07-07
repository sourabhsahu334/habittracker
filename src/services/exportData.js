// Data export (Feature 23).
//
// Builds a CSV of every entry and shares it via the OS share sheet using RN's
// built-in Share API (no extra native module needed). For a true PDF / .csv
// file attachment, add react-native-share + react-native-fs and pass the
// written file's URL to Share instead of the inline text — the CSV builder
// below is reused unchanged.

import { Share } from 'react-native';

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(entries) {
  const header = [
    'Date', 'Subject', 'Chapter', 'Hours', 'Questions', 'Correct', 'Accuracy%',
  ];
  const rows = [...entries]
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .map(e => {
      const acc =
        e.correct != null && e.correct !== '' && e.questions > 0
          ? Math.round((Number(e.correct) / Number(e.questions)) * 100)
          : '';
      return [
        e.dateKey,
        e.subject,
        e.chapter || '',
        e.hours,
        e.questions,
        e.correct ?? '',
        acc,
      ]
        .map(csvEscape)
        .join(',');
    });
  return [header.join(','), ...rows].join('\n');
}

export async function exportEntries(entries) {
  const csv = buildCsv(entries);
  try {
    await Share.share({
      title: 'StudyLog export',
      message: csv,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
