import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Button, Card, Stepper } from '../components/ui';
import { exportEntries } from '../services/exportData';
import { isSupabaseConfigured, supabase } from '../supabase/client';
import { computeNextFire, scheduleDailyReminder, cancelReminder } from '../services/notifications';
import { dayKey } from '../utils/date';
import { totalHoursForDay } from '../utils/stats';

// Settings hub: theme (F22), daily goal (F9), reminder (F13), subjects & exam
// date (F1 editable), export (F23), cloud sync + auth (F15), reset (F14).

export default function SettingsScreen() {
  const { theme, pref, setPref } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    profile,
    subjects,
    entries,
    updateProfile,
    setSubjectList,
    resetAllData,
    backgroundSync,
    meta,
    syncing,
  } = useApp();

  const [goal, setGoal] = useState(profile?.dailyGoalHours || 4);
  const [examDate, setExamDate] = useState(profile?.examDate || '');
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '21:00');
  const [reminderOn, setReminderOn] = useState(profile?.reminderEnabled ?? true);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    setGoal(profile?.dailyGoalHours || 4);
    setExamDate(profile?.examDate || '');
    setReminderTime(profile?.reminderTime || '21:00');
    setReminderOn(profile?.reminderEnabled ?? true);
  }, [profile]);

  // Re-arm the local reminder whenever its settings change (F13).
  useEffect(() => {
    if (reminderOn) {
      const logged = totalHoursForDay(entries, dayKey()) > 0;
      scheduleDailyReminder(
        computeNextFire(reminderTime, logged),
        "Don't forget to log today's study session.",
      );
    } else {
      cancelReminder();
    }
  }, [reminderOn, reminderTime, entries]);

  const saveGoal = v => {
    setGoal(v);
    updateProfile({ dailyGoalHours: v });
  };

  const addSubject = () => {
    const s = newSubject.trim();
    if (s && !subjects.some(x => x.name === s)) {
      setSubjectList([...subjects.map(x => x.name), s]);
    }
    setNewSubject('');
  };
  const removeSubject = name =>
    setSubjectList(subjects.filter(x => x.name !== name).map(x => x.name));

  const doExport = async () => {
    const res = await exportEntries(entries);
    if (!res.ok && res.error) Alert.alert('Export failed', res.error);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset all data',
      'This permanently deletes all your entries, subjects and settings on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset everything', style: 'destructive', onPress: resetAllData },
      ],
    );
  };

  const input = { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: 60 }]}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      {/* Appearance (F22) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Appearance</Text>
        <View style={styles.segment}>
          {[
            { id: 'system', label: 'System' },
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ].map(o => {
            const active = pref === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setPref(o.id)}
                style={[
                  styles.segItem,
                  {
                    backgroundColor: active ? theme.primary : theme.cardAlt,
                  },
                ]}>
                <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Daily goal (F9) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>Daily goal</Text>
        <Stepper value={goal} onChange={saveGoal} step={0.5} min={0.5} max={16} format={v => `${v} h / day`} />
      </Card>

      {/* Exam date (F1/F6) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Exam date</Text>
        <View style={styles.inlineRow}>
          <TextInput
            value={examDate}
            onChangeText={setExamDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            style={[styles.input, input, { flex: 1 }]}
          />
          <Button title="Save" onPress={() => updateProfile({ examDate })} style={{ marginLeft: 8 }} />
        </View>
      </Card>

      {/* Reminder (F13) */}
      <Card>
        <View style={styles.switchRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Evening reminder</Text>
          <Switch value={reminderOn} onValueChange={v => { setReminderOn(v); updateProfile({ reminderEnabled: v }); }} />
        </View>
        {reminderOn && (
          <View style={styles.inlineRow}>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="21:00"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, input, { flex: 1 }]}
            />
            <Button title="Save" onPress={() => updateProfile({ reminderTime })} style={{ marginLeft: 8 }} />
          </View>
        )}
        <Text style={[styles.hint, { color: theme.textFaint }]}>
          Reminds you at this time if you haven't logged. Requires enabling notifications in the build (see README).
        </Text>
      </Card>

      {/* Subjects (F1 editable) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Subjects</Text>
        <View style={styles.subjectWrap}>
          {subjects.map(s => (
            <Pressable
              key={s.id}
              onPress={() => removeSubject(s.name)}
              style={[styles.subjectChip, { backgroundColor: theme.primarySoft }]}>
              <Text style={{ color: theme.primary, fontWeight: '600' }}>{s.name}  ✕</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            value={newSubject}
            onChangeText={setNewSubject}
            placeholder="Add subject"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, input, { flex: 1 }]}
            onSubmitEditing={addSubject}
          />
          <Button title="Add" onPress={addSubject} style={{ marginLeft: 8 }} />
        </View>
      </Card>

      {/* Cloud sync + auth (F15) */}
      <CloudSyncCard theme={theme} meta={meta} syncing={syncing} onSync={backgroundSync} />

      {/* Export (F23) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Export data</Text>
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Export all entries as CSV and share via any app.
        </Text>
        <Button title="Export & share" variant="outline" onPress={doExport} style={{ marginTop: 10 }} />
      </Card>

      {/* Reset (F14) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Danger zone</Text>
        <Button title="Reset all data" variant="danger" onPress={confirmReset} style={{ marginTop: 10 }} />
      </Card>
    </ScrollView>
  );
}

// Auth + manual sync. Local-only mode when Supabase isn't configured.
function CloudSyncCard({ theme, meta, syncing, onSync }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const input = { backgroundColor: theme.cardAlt, borderColor: theme.border, color: theme.text };

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Cloud sync</Text>
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Running in local-only mode. Add your Supabase URL and key in src/supabase/client.js to enable backup and multi-device sync. The app works fully without it.
        </Text>
      </Card>
    );
  }

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const { error: upErr } = await supabase.auth.signUp({ email: email.trim(), password });
      if (upErr) Alert.alert('Sign in failed', upErr.message);
    }
    setBusy(false);
    onSync();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Cloud sync</Text>
      {session ? (
        <View>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Signed in as {session.user.email}
            {meta?.lastSyncAt ? ` · last synced ${new Date(meta.lastSyncAt).toLocaleString()}` : ''}
          </Text>
          <View style={styles.inlineRow}>
            <Button title={syncing ? 'Syncing…' : 'Sync now'} onPress={onSync} disabled={syncing} style={{ flex: 1 }} />
            <Button title="Sign out" variant="outline" onPress={signOut} style={{ flex: 1, marginLeft: 8 }} />
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Sign in to back up and sync across devices.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, input]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textFaint}
            secureTextEntry
            style={[styles.input, input, { marginTop: 8 }]}
          />
          <Button title={busy ? 'Please wait…' : 'Sign in / Sign up'} onPress={signIn} disabled={busy} style={{ marginTop: 10 }} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 14, marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  segment: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  hint: { fontSize: 13, marginTop: 8, lineHeight: 19 },
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  subjectChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
});
