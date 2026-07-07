import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import {
  Card,
  EmptyState,
  Pill,
  StackedBar,
  subjectColor,
} from '../components/ui';
import Heatmap from '../components/Heatmap';
import HabitSection from '../components/HabitSection';
import { accuracy, subjectTotals, weakSubjects } from '../utils/stats';
import { prettyDate } from '../utils/date';

// Progress hub: calendar heatmap (F5 + missed-day view F20), subject-wise
// breakdown (F7), weak-subject flags (F12), overall accuracy (F18) and the
// custom habit grid (F21).

export default function ProgressScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { entries } = useApp();
  const [selectedDay, setSelectedDay] = useState(null);

  const hoursByDay = useMemo(() => {
    const map = {};
    for (const e of entries) {
      map[e.dateKey] = (map[e.dateKey] || 0) + (Number(e.hours) || 0);
    }
    return map;
  }, [entries]);

  const totals = useMemo(() => subjectTotals(entries), [entries]);
  const weak = useMemo(() => new Set(weakSubjects(entries)), [entries]);
  const grandHours = totals.reduce((s, t) => s + t.hours, 0);

  const overallCorrect = totals.reduce((s, t) => s + (t.hasAccuracy ? t.correct : 0), 0);
  const overallSolvedWithAcc = totals
    .filter(t => t.hasAccuracy)
    .reduce((s, t) => s + t.questions, 0);
  const overallAcc = accuracy(overallCorrect, overallSolvedWithAcc);

  const selectedEntries = selectedDay
    ? entries.filter(e => e.dateKey === selectedDay)
    : [];

  if (entries.length === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon="📊"
          title="Your progress will appear here"
          subtitle="Log a few study sessions and you'll see your heatmap, subject breakdown and streak consistency."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: 40 }]}>
      <Text style={[styles.title, { color: theme.text }]}>Progress</Text>

      {/* Heatmap (F5) + missed-day awareness (F20) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Consistency</Text>
        <Text style={[styles.subtle, { color: theme.textMuted }]}>
          Last 84 days · darker = more hours · empty = no study
        </Text>
        <Heatmap
          hoursByDay={hoursByDay}
          days={84}
          onSelectDay={setSelectedDay}
          selectedKey={selectedDay}
        />
        {selectedDay && (
          <View style={[styles.dayDetail, { borderColor: theme.border }]}>
            <Text style={[styles.dayDetailTitle, { color: theme.text }]}>
              {prettyDate(selectedDay)}
            </Text>
            {selectedEntries.length === 0 ? (
              <Text style={{ color: theme.textMuted }}>No study logged this day.</Text>
            ) : (
              selectedEntries.map(e => (
                <Text key={e.id} style={{ color: theme.textMuted, marginTop: 2 }}>
                  • {e.subject} — {e.hours}h, {e.questions}q
                </Text>
              ))
            )}
          </View>
        )}
      </Card>

      {/* Overall accuracy (F18) */}
      {overallAcc != null && (
        <Card>
          <View style={styles.accRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Overall accuracy</Text>
            <Text style={[styles.accBig, { color: theme.accent }]}>{overallAcc}%</Text>
          </View>
          <Text style={[styles.subtle, { color: theme.textMuted }]}>
            {overallCorrect}/{overallSolvedWithAcc} questions correct (where entered)
          </Text>
        </Card>
      )}

      {/* Subject breakdown (F7) + weak flags (F12) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Subject breakdown</Text>
        <StackedBar
          segments={totals.map((t, i) => ({ value: t.hours, color: subjectColor(i) }))}
        />
        <View style={{ marginTop: 14 }}>
          {totals.map((t, i) => {
            const acc = t.hasAccuracy ? accuracy(t.correct, t.questions) : null;
            const pct = grandHours > 0 ? Math.round((t.hours / grandHours) * 100) : 0;
            return (
              <View key={t.subject} style={styles.subjectRow}>
                <View style={styles.subjectLeft}>
                  <View style={[styles.dot, { backgroundColor: subjectColor(i) }]} />
                  <Text style={[styles.subjectName, { color: theme.text }]}>{t.subject}</Text>
                  {weak.has(t.subject) && (
                    <Pill text="Needs attention" color={theme.warn} bg={theme.warnSoft} />
                  )}
                </View>
                <View style={styles.subjectRight}>
                  <Text style={[styles.subjectStat, { color: theme.textMuted }]}>
                    {round(t.hours)}h · {t.questions}q{acc != null ? ` · ${acc}%` : ''}
                  </Text>
                  <Text style={[styles.subjectPct, { color: theme.textFaint }]}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
        {weak.size > 0 && (
          <Text style={[styles.weakNote, { color: theme.warn }]}>
            ⚠ Flagged subjects are studied under 20% of your top subject's hours.
          </Text>
        )}
      </Card>

      {/* Custom habits (F21) */}
      <HabitSection />
    </ScrollView>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 14, marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  subtle: { fontSize: 13, marginBottom: 12, marginTop: 4 },
  dayDetail: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  dayDetailTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  accRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accBig: { fontSize: 24, fontWeight: '900' },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 8 },
  subjectRight: { alignItems: 'flex-end' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  subjectName: { fontSize: 15, fontWeight: '600' },
  subjectStat: { fontSize: 13 },
  subjectPct: { fontSize: 12, marginTop: 2 },
  weakNote: { fontSize: 12, marginTop: 6, lineHeight: 17 },
});
