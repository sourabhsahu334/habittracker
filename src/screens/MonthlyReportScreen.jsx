import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Card, StackedBar, subjectColor } from '../components/ui';
import { monthStats } from '../utils/stats';
import { addDays, monthKey, prettyMonth } from '../utils/date';

// Monthly progress report (Feature 16). Summarises one month: total hours &
// questions, days studied, best streak, subject breakdown, and goal hit/miss
// tally. Month can be stepped backwards/forwards.

export default function MonthlyReportScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, profile } = useApp();
  const [mKey, setMKey] = useState(monthKey());

  const goal = profile?.dailyGoalHours || 0;
  const stats = useMemo(() => monthStats(entries, mKey), [entries, mKey]);
  const grandHours = stats.subjects.reduce((s, t) => s + t.hours, 0);

  const goalTally = useMemo(() => {
    let hit = 0;
    Object.values(stats.byDate).forEach(list => {
      const hours = list.reduce((s, e) => s + (Number(e.hours) || 0), 0);
      if (goal > 0 && hours >= goal) hit += 1;
    });
    return { hit, missed: stats.daysStudied - hit };
  }, [stats, goal]);

  const shiftMonth = delta => {
    const [y, m] = mKey.split('-').map(Number);
    const d = new Date(y, m - 1, 15);
    setMKey(monthKey(addDays(d, delta * 30)));
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: 40 }]}>
      <View style={styles.monthNav}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12}>
          <Text style={[styles.navArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.text }]}>{prettyMonth(mKey)}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={12}>
          <Text style={[styles.navArrow, { color: theme.primary }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <Metric theme={theme} value={round(stats.totalHours)} label="Total hours" />
        <Metric theme={theme} value={stats.totalQuestions} label="Questions" />
        <Metric theme={theme} value={stats.daysStudied} label="Days studied" />
        <Metric theme={theme} value={stats.bestStreak} label="Best streak" />
      </View>

      {goal > 0 && (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily goal ({goal}h)</Text>
          <View style={styles.goalRow}>
            <Text style={[styles.goalHit, { color: theme.accent }]}>{goalTally.hit} hit</Text>
            <Text style={[styles.goalMiss, { color: theme.danger }]}>{goalTally.missed} under goal</Text>
          </View>
        </Card>
      )}

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Subject breakdown</Text>
        {stats.subjects.length === 0 ? (
          <Text style={{ color: theme.textMuted, marginTop: 8 }}>No study logged this month.</Text>
        ) : (
          <>
            <View style={{ marginTop: 10 }}>
              <StackedBar
                segments={stats.subjects.map((t, i) => ({ value: t.hours, color: subjectColor(i) }))}
              />
            </View>
            <View style={{ marginTop: 14 }}>
              {stats.subjects.map((t, i) => {
                const pct = grandHours > 0 ? Math.round((t.hours / grandHours) * 100) : 0;
                return (
                  <View key={t.subject} style={styles.subjectRow}>
                    <View style={styles.subjectLeft}>
                      <View style={[styles.dot, { backgroundColor: subjectColor(i) }]} />
                      <Text style={[styles.subjectName, { color: theme.text }]}>{t.subject}</Text>
                    </View>
                    <Text style={[styles.subjectStat, { color: theme.textMuted }]}>
                      {round(t.hours)}h · {t.questions}q · {pct}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
}

function Metric({ theme, value, label }) {
  return (
    <View style={[styles.metric, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.metricValue, { color: theme.primary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 4 },
  navArrow: { fontSize: 34, fontWeight: '800', width: 40, textAlign: 'center' },
  monthTitle: { fontSize: 20, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  metric: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: { fontSize: 30, fontWeight: '900' },
  metricLabel: { fontSize: 13, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  goalRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  goalHit: { fontSize: 18, fontWeight: '800' },
  goalMiss: { fontSize: 18, fontWeight: '800' },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  subjectName: { fontSize: 15, fontWeight: '600' },
  subjectStat: { fontSize: 13 },
});
