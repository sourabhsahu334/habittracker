import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Button, Stepper } from '../components/ui';
import { EXAM_CATEGORIES, presetSubjects } from '../constants/examPresets';
import { dayKey } from '../utils/date';

// One-minute onboarding (Feature 1). Three light steps: identity, subjects,
// goal. Sensible defaults everywhere so the user can breeze through.

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('jee_neet');
  const [examDate, setExamDate] = useState(defaultExamDate());
  const [subjects, setSubjects] = useState(presetSubjects('jee_neet'));
  const [newSubject, setNewSubject] = useState('');
  const [goal, setGoal] = useState(4);

  const pickCategory = id => {
    setCategory(id);
    setSubjects(presetSubjects(id));
  };

  const addSubject = () => {
    const s = newSubject.trim();
    if (s && !subjects.includes(s)) setSubjects([...subjects, s]);
    setNewSubject('');
  };
  const removeSubject = s => setSubjects(subjects.filter(x => x !== s));

  const finish = () => {
    completeOnboarding({
      profile: {
        name: name.trim() || 'Student',
        examCategory: category,
        examDate,
        dailyGoalHours: goal,
        reminderEnabled: true,
        reminderTime: '21:00',
      },
      subjects: subjects.length ? subjects : ['General'],
    });
  };

  const input = {
    backgroundColor: theme.card,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.brand, { color: theme.primary }]}>StudyLog</Text>
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? theme.primary : theme.border },
              ]}
            />
          ))}
        </View>

        {step === 0 && (
          <View>
            <Text style={[styles.h1, { color: theme.text }]}>Welcome 👋</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              Let's set up your tracker. Takes under a minute.
            </Text>

            <Label theme={theme}>Your name</Label>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aarav"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, input]}
            />

            <Label theme={theme}>Which exam are you preparing for?</Label>
            <View style={styles.catWrap}>
              {EXAM_CATEGORIES.map(c => {
                const active = c.id === category;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => pickCategory(c.id)}
                    style={[
                      styles.cat,
                      {
                        backgroundColor: active ? theme.primary : theme.card,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}>
                    <Text
                      style={{
                        color: active ? '#fff' : theme.text,
                        fontWeight: '600',
                      }}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Label theme={theme}>Exam date (YYYY-MM-DD)</Label>
            <TextInput
              value={examDate}
              onChangeText={setExamDate}
              placeholder="2026-05-01"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, input]}
              autoCapitalize="none"
            />
            <Button title="Next" onPress={() => setStep(1)} style={{ marginTop: 20 }} />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={[styles.h1, { color: theme.text }]}>Your subjects</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              Add or remove to match what you're studying.
            </Text>

            <View style={styles.subjectWrap}>
              {subjects.map(s => (
                <Pressable
                  key={s}
                  onPress={() => removeSubject(s)}
                  style={[styles.subjectChip, { backgroundColor: theme.primarySoft }]}>
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>
                    {s}  ✕
                  </Text>
                </Pressable>
              ))}
              {subjects.length === 0 && (
                <Text style={{ color: theme.textFaint }}>No subjects yet — add one below.</Text>
              )}
            </View>

            <View style={styles.addRow}>
              <TextInput
                value={newSubject}
                onChangeText={setNewSubject}
                placeholder="Add a subject"
                placeholderTextColor={theme.textFaint}
                style={[styles.input, input, { flex: 1, marginBottom: 0 }]}
                onSubmitEditing={addSubject}
              />
              <Button title="Add" onPress={addSubject} style={{ marginLeft: 8 }} />
            </View>

            <View style={styles.navRow}>
              <Button title="Back" variant="outline" onPress={() => setStep(0)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Next" onPress={() => setStep(2)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.h1, { color: theme.text }]}>Daily goal</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              How many hours do you aim to study each day?
            </Text>

            <View style={[styles.goalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Stepper
                value={goal}
                onChange={setGoal}
                step={0.5}
                min={0.5}
                max={16}
                format={v => `${v} h / day`}
              />
            </View>

            <View style={styles.navRow}>
              <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Start tracking" onPress={finish} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ children, theme }) {
  return <Text style={[styles.label, { color: theme.textMuted }]}>{children}</Text>;
}

function defaultExamDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return dayKey(d);
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  brand: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 18, gap: 8 },
  dot: { width: 26, height: 6, borderRadius: 3 },
  h1: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 20, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 4,
  },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: 8 },
  subjectChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  navRow: { flexDirection: 'row', marginTop: 26 },
  goalBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 24, marginTop: 8 },
});
