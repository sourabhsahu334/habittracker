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
import { Button, Card, Stepper } from '../components/ui';
import { newId } from '../storage/repository';
import { dayKey, prettyDate } from '../utils/date';

// Primary action: log a study session in under 30 seconds (Features 2, 3).
// Supports several subject cards at once, plus optional accuracy (Feature 18)
// and chapter/topic free text (Feature 19). Reused for editing a single past
// entry when navigated with an `editEntry` param (Feature 11).

function blankCard(subject) {
  return {
    key: newId(),
    subject: subject || '',
    hours: 1,
    questions: 0,
    correct: '',
    chapter: '',
  };
}

export default function EntryScreen({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { subjects, saveEntry } = useApp();
  const editEntry = route?.params?.editEntry;
  const targetDate = route?.params?.dateKey || dayKey();

  const subjectNames = subjects.map(s => s.name);
  const defaultSubject = subjectNames[0] || '';

  const [cards, setCards] = useState(
    editEntry
      ? [
          {
            key: editEntry.id,
            subject: editEntry.subject,
            hours: Number(editEntry.hours) || 0,
            questions: Number(editEntry.questions) || 0,
            correct: editEntry.correct != null ? String(editEntry.correct) : '',
            chapter: editEntry.chapter || '',
          },
        ]
      : [blankCard(defaultSubject)],
  );

  const patch = (key, field, value) =>
    setCards(cards.map(c => (c.key === key ? { ...c, [field]: value } : c)));

  const addCard = () =>
    setCards([...cards, blankCard(defaultSubject)]);
  const removeCard = key => setCards(cards.filter(c => c.key !== key));

  const canSave = cards.every(c => c.subject && c.hours >= 0);

  const save = async () => {
    for (const c of cards) {
      if (!c.subject) continue;
      const correctNum =
        c.correct === '' || c.correct == null ? null : Number(c.correct);
      await saveEntry({
        id: editEntry ? editEntry.id : undefined,
        dateKey: editEntry ? editEntry.dateKey : targetDate,
        subject: c.subject,
        hours: Number(c.hours) || 0,
        questions: Number(c.questions) || 0,
        correct: correctNum,
        chapter: c.chapter.trim() || null,
      });
    }
    navigation.goBack();
  };

  const inputStyle = {
    backgroundColor: theme.cardAlt,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
          {editEntry ? 'Editing entry' : prettyDate(targetDate)}
        </Text>

        {subjectNames.length === 0 && (
          <Card>
            <Text style={{ color: theme.textMuted }}>
              You have no subjects yet. Add subjects in Settings first.
            </Text>
          </Card>
        )}

        {cards.map((c, idx) => (
          <Card key={c.key}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Subject {cards.length > 1 ? idx + 1 : ''}
              </Text>
              {cards.length > 1 && (
                <Pressable onPress={() => removeCard(c.key)}>
                  <Text style={{ color: theme.danger, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              )}
            </View>

            {/* Subject picker (chips act as a dropdown) */}
            <View style={styles.chipWrap}>
              {subjectNames.map(name => {
                const active = c.subject === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => patch(c.key, 'subject', name)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? theme.primary : theme.cardAlt,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}>
                    <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.stepperRow}>
              <View style={styles.stepperCol}>
                <Stepper
                  label="Hours"
                  value={c.hours}
                  onChange={v => patch(c.key, 'hours', v)}
                  step={0.5}
                  min={0}
                  format={v => `${v} h`}
                />
              </View>
            </View>

            <View style={styles.stepperRow}>
              <View style={styles.stepperCol}>
                <Stepper
                  label="Questions solved"
                  value={c.questions}
                  onChange={v => patch(c.key, 'questions', v)}
                  step={5}
                  min={0}
                />
              </View>
            </View>

            <Text style={[styles.smallLabel, { color: theme.textMuted }]}>
              Correct (optional)
            </Text>
            <TextInput
              value={c.correct}
              onChangeText={t => patch(c.key, 'correct', t.replace(/[^0-9]/g, ''))}
              placeholder="Leave blank to skip accuracy"
              placeholderTextColor={theme.textFaint}
              keyboardType="number-pad"
              style={[styles.input, inputStyle]}
            />

            <Text style={[styles.smallLabel, { color: theme.textMuted }]}>
              Chapter / topic (optional)
            </Text>
            <TextInput
              value={c.chapter}
              onChangeText={t => patch(c.key, 'chapter', t)}
              placeholder="e.g. Thermodynamics"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, inputStyle]}
            />
          </Card>
        ))}

        {!editEntry && subjectNames.length > 0 && (
          <Button title="+ Add another subject" variant="outline" onPress={addCard} />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: insets.bottom + 12 },
        ]}>
        <Button
          title={editEntry ? 'Save changes' : 'Save session'}
          onPress={save}
          disabled={!canSave || subjectNames.length === 0}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  dateLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  stepperRow: { marginBottom: 14 },
  stepperCol: { flex: 1 },
  smallLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 2 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
