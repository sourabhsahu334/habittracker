import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Button, Card } from './ui';
import { addDays, dayKey, parseDayKey } from '../utils/date';

// Custom daily habits (Feature 21). Users define their own yes/no or numeric
// habits (e.g. "Slept 8 hours", "Mock test taken", "Water intake") and log
// them alongside study. Shows a compact 7-day grid of recent completion.

export default function HabitSection() {
  const { theme } = useTheme();
  const { habits, habitLogs, saveHabit, removeHabit, logHabit } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('bool');

  const today = dayKey();
  const last7 = Array.from({ length: 7 }, (_, i) =>
    dayKey(addDays(parseDayKey(today), -(6 - i))),
  );

  const logFor = (habitId, dKey) =>
    habitLogs.find(l => l.habitId === habitId && l.dateKey === dKey);

  const addHabit = () => {
    const n = name.trim();
    if (!n) return;
    saveHabit({ name: n, type });
    setName('');
    setType('bool');
    setAdding(false);
  };

  const input = { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Daily habits</Text>
        <Pressable onPress={() => setAdding(a => !a)}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>
            {adding ? 'Cancel' : '+ Add'}
          </Text>
        </Pressable>
      </View>

      {adding && (
        <View style={styles.addBox}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name e.g. Mock test taken"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, input]}
          />
          <View style={styles.typeRow}>
            {[
              { id: 'bool', label: 'Yes / No' },
              { id: 'number', label: 'Number' },
            ].map(t => {
              const active = type === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setType(t.id)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active ? theme.primary : theme.cardAlt,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}>
                  <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button title="Add habit" onPress={addHabit} />
        </View>
      )}

      {habits.length === 0 && !adding && (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          Track routine habits like sleep, revision or mock tests. Tap + Add.
        </Text>
      )}

      {habits.map(h => {
        const todayLog = logFor(h.id, today);
        return (
          <View key={h.id} style={[styles.habitRow, { borderColor: theme.border }]}>
            <View style={styles.habitTop}>
              <Text style={[styles.habitName, { color: theme.text }]}>{h.name}</Text>
              <Pressable onPress={() => removeHabit(h.id)}>
                <Text style={{ color: theme.textFaint, fontSize: 13 }}>Remove</Text>
              </Pressable>
            </View>

            {/* Today's control */}
            {h.type === 'bool' ? (
              <Pressable
                onPress={() => logHabit(h.id, today, todayLog?.value ? 0 : 1)}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: todayLog?.value ? theme.accent : theme.cardAlt,
                    borderColor: todayLog?.value ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={{ color: todayLog?.value ? '#fff' : theme.textMuted, fontWeight: '700' }}>
                  {todayLog?.value ? '✓ Done today' : 'Mark done today'}
                </Text>
              </Pressable>
            ) : (
              <TextInput
                value={todayLog?.value != null ? String(todayLog.value) : ''}
                onChangeText={t => logHabit(h.id, today, Number(t.replace(/[^0-9.]/g, '')) || 0)}
                placeholder="Enter today's value"
                placeholderTextColor={theme.textFaint}
                keyboardType="numeric"
                style={[styles.input, input, { marginTop: 8 }]}
              />
            )}

            {/* 7-day mini grid */}
            <View style={styles.gridRow}>
              {last7.map(dKey => {
                const l = logFor(h.id, dKey);
                const done = l && Number(l.value) > 0;
                return (
                  <View
                    key={dKey}
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: done ? theme.accent : theme.cardAlt,
                        borderColor: dKey === today ? theme.primary : 'transparent',
                        borderWidth: dKey === today ? 1.5 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  addBox: { marginTop: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  empty: { fontSize: 13, marginTop: 10, lineHeight: 19 },
  habitRow: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  habitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitName: { fontSize: 15, fontWeight: '600' },
  toggle: { marginTop: 8, paddingVertical: 11, borderRadius: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  gridRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  gridCell: { flex: 1, height: 18, borderRadius: 4 },
});
