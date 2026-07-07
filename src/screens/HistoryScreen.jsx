import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Button, Card, EmptyState, Pill } from '../components/ui';
import { accuracy } from '../utils/stats';
import { dayKey, daysBetween, prettyDate } from '../utils/date';

// History log (Feature 10): entries grouped by date, newest first, tap to
// expand. Includes edit/delete per entry (Feature 11) and visually flags gap
// days between logged days as missed (Feature 20).

export default function HistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, profile, removeEntry } = useApp();
  const [expanded, setExpanded] = useState({});

  const goal = profile?.dailyGoalHours || 0;

  // Build a display list: for each logged day (newest first) a group, and
  // between consecutive logged days insert "missed day" markers.
  const days = useMemo(() => {
    const byDate = {};
    for (const e of entries) (byDate[e.dateKey] = byDate[e.dateKey] || []).push(e);
    const keys = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1));

    const rows = [];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const list = byDate[k];
      const hours = list.reduce((s, e) => s + (Number(e.hours) || 0), 0);
      rows.push({ type: 'day', dateKey: k, entries: list, hours });

      // Count missed days between this logged day and the next older one.
      if (i < keys.length - 1) {
        const gap = daysBetween(keys[i + 1], k) - 1;
        if (gap > 0) rows.push({ type: 'gap', count: gap, key: `gap-${k}` });
      }
    }
    return rows;
  }, [entries]);

  const confirmDelete = entry => {
    Alert.alert('Delete entry', `Delete ${entry.subject} (${entry.hours}h)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <EmptyState
          icon="🗓️"
          title="No history yet"
          subtitle="Sessions you log will show up here, grouped by day with your hours and questions."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: 40 }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        <Button
          title="Monthly report"
          variant="outline"
          onPress={() => navigation.navigate('MonthlyReport')}
          style={styles.reportBtn}
        />
      </View>

      {days.map(row => {
        if (row.type === 'gap') {
          return (
            <View key={row.key} style={styles.gapRow}>
              <View style={[styles.gapLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.gapText, { color: theme.textFaint }]}>
                {row.count} missed {row.count === 1 ? 'day' : 'days'}
              </Text>
              <View style={[styles.gapLine, { backgroundColor: theme.border }]} />
            </View>
          );
        }

        const isOpen = expanded[row.dateKey];
        const goalHit = goal > 0 && row.hours >= goal;
        const questions = row.entries.reduce((s, e) => s + (Number(e.questions) || 0), 0);
        return (
          <Card key={row.dateKey}>
            <Pressable
              onPress={() => setExpanded(p => ({ ...p, [row.dateKey]: !p[row.dateKey] }))}
              style={styles.dayHeader}>
              <View>
                <Text style={[styles.dayDate, { color: theme.text }]}>
                  {prettyDate(row.dateKey)}
                  {row.dateKey === dayKey() ? '  · Today' : ''}
                </Text>
                <Text style={[styles.daySummary, { color: theme.textMuted }]}>
                  {round(row.hours)}h · {questions}q · {row.entries.length}{' '}
                  {row.entries.length === 1 ? 'subject' : 'subjects'}
                </Text>
              </View>
              <View style={styles.dayRight}>
                {goal > 0 && (
                  <Pill
                    text={goalHit ? 'Goal hit' : 'Missed goal'}
                    color={goalHit ? theme.accent : theme.danger}
                    bg={goalHit ? theme.accentSoft : theme.dangerSoft}
                  />
                )}
                <Text style={{ color: theme.textFaint, marginLeft: 8 }}>
                  {isOpen ? '▲' : '▼'}
                </Text>
              </View>
            </Pressable>

            {isOpen &&
              row.entries.map(e => {
                const acc =
                  e.correct != null && e.correct !== '' && e.questions > 0
                    ? accuracy(Number(e.correct), Number(e.questions))
                    : null;
                return (
                  <View key={e.id} style={[styles.entry, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.entrySubject, { color: theme.text }]}>
                        {e.subject}
                        {e.chapter ? (
                          <Text style={{ color: theme.textFaint }}> · {e.chapter}</Text>
                        ) : null}
                      </Text>
                      <Text style={[styles.entryStat, { color: theme.textMuted }]}>
                        {e.hours}h · {e.questions}q{acc != null ? ` · ${acc}% correct` : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate('Entry', { editEntry: e })}
                      hitSlop={8}>
                      <Text style={{ color: theme.primary, fontWeight: '700', marginRight: 14 }}>
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(e)} hitSlop={8}>
                      <Text style={{ color: theme.danger, fontWeight: '700' }}>Delete</Text>
                    </Pressable>
                  </View>
                );
              })}
          </Card>
        );
      })}
    </ScrollView>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  reportBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayDate: { fontSize: 16, fontWeight: '700' },
  daySummary: { fontSize: 13, marginTop: 3 },
  dayRight: { flexDirection: 'row', alignItems: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  entrySubject: { fontSize: 15, fontWeight: '600' },
  entryStat: { fontSize: 13, marginTop: 2 },
  gapRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, paddingHorizontal: 8 },
  gapLine: { flex: 1, height: StyleSheet.hairlineWidth },
  gapText: { fontSize: 12, marginHorizontal: 10 },
});
