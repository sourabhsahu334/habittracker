import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { BarChart, Button, Card, EmptyState, ProgressBar } from '../components/ui';
import { dayKey, daysUntil, WEEKDAY_LABELS } from '../utils/date';
import {
  bestStreak,
  currentStreak,
  totalHoursForDay,
  weekStats,
} from '../utils/stats';

// Home dashboard. Surfaces the highest-value glanceable metrics: exam
// countdown (F6), current & best streak (F4/F17), today's goal progress (F9),
// and this week's stats (F8). Every deeper screen is one tab away (<=3 taps).

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, entries } = useApp();

  const today = dayKey();
  const stats = useMemo(() => {
    const cur = currentStreak(entries, today);
    return {
      current: cur,
      best: Math.max(bestStreak(entries), cur),
      todayHours: totalHoursForDay(entries, today),
      week: weekStats(entries),
    };
  }, [entries, today]);

  const goal = profile?.dailyGoalHours || 0;
  const goalHit = goal > 0 && stats.todayHours >= goal;
  const daysLeft = profile?.examDate ? daysUntil(profile.examDate) : null;
  const examOver = daysLeft != null && daysLeft < 0;

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

  console.log("stats", stats);
  console.log("profile", profile);
  console.log("entries", entries);
  console.log("goal", goal);
  console.log("today", today);



  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: 40 }]}>
      <Text style={[styles.greeting, { color: theme.text }]}>
        Hi {profile?.name || 'there'} 👋
      </Text>

      {/* Exam countdown (Feature 6) */}
      <Card style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
        {examOver ? (
          <View>
            <Text style={styles.countLabelLight}>Your exam date has passed 🎉</Text>
            <Text style={styles.countOver}>Set your next exam date in Settings.</Text>
          </View>
        ) : (
          <View style={styles.countRow}>
            <View>
              <Text style={styles.countLabelLight}>Days until exam</Text>
              <Text style={styles.countSub}>{profile?.examDate}</Text>
            </View>
            <Text style={styles.countNumber}>{daysLeft ?? '—'}</Text>
          </View>
        )}
      </Card>

      {/* Streaks (Features 4 & 17) */}
      <View style={styles.row}>
        <Card style={styles.half}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNum, { color: theme.text }]}>{stats.current}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current streak</Text>
        </Card>
        <Card style={styles.half}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={[styles.statNum, { color: theme.text }]}>{stats.best}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best streak</Text>
        </Card>
      </View>

      {/* Today's goal (Feature 9) */}
      <Card>
        <View style={styles.goalHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Today's goal</Text>
          <Text
            style={{
              color: goalHit ? theme.accent : theme.textMuted,
              fontWeight: '700',
            }}>
            {goalHit ? '✓ Goal hit' : goal ? 'In progress' : 'No goal set'}
          </Text>
        </View>
        <Text style={[styles.goalHours, { color: theme.text }]}>
          {stats.todayHours}
          <Text style={{ color: theme.textMuted, fontSize: 16 }}> / {goal} h</Text>
        </Text>
        <ProgressBar
          progress={goal ? stats.todayHours / goal : 0}
          color={goalHit ? theme.accent : theme.primary}
        />
      </Card>

      {/* Weekly stats (Feature 8) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 4 }]}>This week</Text>
        <View style={styles.weekTotals}>
          <View>
            <Text style={[styles.weekNum, { color: theme.primary }]}>{round(stats.week.totalHours)}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>hours</Text>
          </View>
          <View>
            <Text style={[styles.weekNum, { color: theme.accent }]}>{stats.week.totalQuestions}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>questions</Text>
          </View>
        </View>
        <BarChart
          data={stats.week.perDay.map((d, i) => ({ label: WEEKDAY_LABELS[i], value: d.hours }))}
          highlightIndex={todayIdx}
        />
      </Card>

      {stats.current === 0 && entries.length === 0 && (
        <EmptyState
          icon="📚"
          title="No sessions logged yet"
          subtitle="Tap the + tab to log your first study session and start your streak."
        />
      )}

      <Button
        title="+ Log a study session"
        onPress={() => navigation.navigate('Entry')}
        style={{ marginTop: 6 }}
      />
    </ScrollView>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  greeting: { fontSize: 24, fontWeight: '800', marginBottom: 14, marginTop: 4 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countLabelLight: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  countSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  countNumber: { color: '#fff', fontSize: 56, fontWeight: '900' },
  countOver: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6 },
  row: { flexDirection: 'row', gap: 14 },
  half: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 26, marginBottom: 4 },
  statNum: { fontSize: 32, fontWeight: '900' },
  statLabel: { fontSize: 13, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalHours: { fontSize: 30, fontWeight: '900', marginBottom: 10 },
  weekTotals: { flexDirection: 'row', gap: 40, marginBottom: 14, marginTop: 6 },
  weekNum: { fontSize: 26, fontWeight: '900' },
});
