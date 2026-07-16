import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Button, Stepper, Card } from '../components/ui';
import { EXAM_CATEGORIES, presetSubjects } from '../constants/examPresets';
import { dayKey } from '../utils/date';
import { supabase, isSupabaseConfigured } from '../supabase/client';

// One-minute onboarding (Feature 1). Three light steps: identity, subjects,
// goal. Sensible defaults everywhere so the user can breeze through.

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, backgroundSync } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('jee_neet');
  const [examDate, setExamDate] = useState(defaultExamDate());
  const [notDeclared, setNotDeclared] = useState(false);
  const [subjects, setSubjects] = useState(presetSubjects('jee_neet'));
  const [newSubject, setNewSubject] = useState('');
  const [goal, setGoal] = useState(4);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [signupStep, setSignupStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      Alert.alert('Sign in failed', error.message);
      setAuthBusy(false);
      return;
    }
    const syncRes = await backgroundSync();
    setAuthBusy(false);
    if (syncRes.ok) {
      setShowAuthModal(false);
    } else {
      Alert.alert(
        'Sync issue',
        'Signed in successfully, but background sync encountered an error: ' +
          (syncRes.reason || 'unknown'),
      );
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true }
    });
    setAuthBusy(false);
    if (error) {
      Alert.alert('Error sending OTP', error.message);
    } else {
      Alert.alert('OTP Sent', 'Check your email inbox for a 6-digit verification code.');
      setSignupStep(1);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: 'email'
    });
    setAuthBusy(false);
    if (error) {
      Alert.alert('Verification failed', error.message);
    } else {
      setSignupStep(2);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword.trim()
    });
    if (error) {
      Alert.alert('Failed to set password', error.message);
      setAuthBusy(false);
      return;
    }
    const syncRes = await backgroundSync();
    setAuthBusy(false);
    setSignupStep(0);
    setAuthMode('signin');
    if (syncRes.ok) {
      setShowAuthModal(false);
    } else {
      Alert.alert(
        'Sync issue',
        'Account verified and password set, but background sync failed: ' +
          (syncRes.reason || 'unknown'),
      );
    }
  };

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
        examDate: examDate.trim() || null,
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
        <View style={styles.headerRow}>
          <Text style={[styles.brand, { color: theme.primary }]}>StudyLog</Text>
          {isSupabaseConfigured && (
            <Pressable
              onPress={() => {
                setEmail('');
                setPassword('');
                setAuthBusy(false);
                setShowAuthModal(true);
              }}
              style={({ pressed }) => [
                styles.signInBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={[styles.signInBtnText, { color: theme.primary }]}>Sign In</Text>
            </Pressable>
          )}
        </View>
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
              onChangeText={text => {
                setExamDate(text);
                if (text.trim().length > 0 && notDeclared) {
                  setNotDeclared(false);
                }
              }}
              placeholder="2026-05-01"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, input, notDeclared && { opacity: 0.5 }]}
              autoCapitalize="none"
              editable={!notDeclared}
            />
            <Pressable
              onPress={() => {
                if (notDeclared) {
                  setNotDeclared(false);
                  setExamDate(defaultExamDate());
                } else {
                  setNotDeclared(true);
                  setExamDate('');
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 16,
              }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: notDeclared ? theme.primary : theme.border,
                  borderRadius: 4,
                  backgroundColor: notDeclared ? theme.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                }}>
                {notDeclared && (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: -1 }}>✓</Text>
                )}
              </View>
              <Text style={{ color: theme.text, fontSize: 14 }}>Not Declared / Undecided</Text>
            </Pressable>
            <Button title="Next" onPress={() => setStep(1)} style={{ marginTop: 10 }} />
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

            <Text style={[styles.h1, { color: theme.text, marginTop: 24 }]}>Daily goal</Text>
            <Text style={[styles.sub, { color: theme.textMuted, marginBottom: 8 }]}>
              How many hours do you aim to study each day?
            </Text>

            <View style={[styles.goalBox, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 20 }]}>
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
              <Button title="Back" variant="outline" onPress={() => setStep(0)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Next" onPress={() => setStep(2)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.h1, { color: theme.text }]}>Cloud Backup</Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              Keep your progress synced and safe.
            </Text>

            {isSupabaseConfigured ? (
              <Card style={{ marginTop: 8, marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                  Cloud Backup (Optional)
                </Text>
                {session && signupStep !== 2 ? (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>
                      ✓ Signed in as <Text style={{ fontWeight: '600' }}>{session.user.email}</Text>
                    </Text>
                  </View>
                ) : (
                  <View>
                    {signupStep === 0 && (
                      <View>
                        <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8 }}>
                          Sign up to sync your data across devices.
                        </Text>
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="Email"
                          placeholderTextColor={theme.textFaint}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          style={[styles.input, input]}
                          editable={!authBusy}
                        />
                        <Button
                          title={authBusy ? 'Sending OTP…' : 'Send OTP'}
                          onPress={handleSendOTP}
                          disabled={authBusy}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}

                    {signupStep === 1 && (
                      <View>
                        <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
                          Enter the 6-digit OTP code sent to {email}.
                        </Text>
                        <TextInput
                          value={otpCode}
                          onChangeText={setOtpCode}
                          placeholder="6-digit code"
                          placeholderTextColor={theme.textFaint}
                          keyboardType="numeric"
                          style={[styles.input, input]}
                          editable={!authBusy}
                        />
                        <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                          <Button
                            title="Back"
                            variant="outline"
                            onPress={() => setSignupStep(0)}
                            disabled={authBusy}
                            style={{ flex: 1 }}
                          />
                          <Button
                            title={authBusy ? 'Verifying…' : 'Verify OTP'}
                            onPress={handleVerifyOTP}
                            disabled={authBusy}
                            style={{ flex: 2 }}
                          />
                        </View>
                      </View>
                    )}

                    {signupStep === 2 && (
                      <View>
                        <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
                          Email verified! Set a password to complete signup.
                        </Text>
                        <TextInput
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="New Password (min 6 chars)"
                          placeholderTextColor={theme.textFaint}
                          secureTextEntry
                          autoCapitalize="none"
                          style={[styles.input, input]}
                          editable={!authBusy}
                        />
                        <Button
                          title={authBusy ? 'Completing…' : 'Complete Signup'}
                          onPress={handleSetPassword}
                          disabled={authBusy}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </Card>
            ) : (
              <Card style={{ marginTop: 8, marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                  Cloud Backup (Offline Mode)
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
                  Running in offline-first mode. Setup Supabase details to enable database synchronization. Your data will be saved locally on this device.
                </Text>
              </Card>
            )}

            <View style={styles.navRow}>
              <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Start tracking" onPress={finish} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!authBusy) setShowAuthModal(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 8 }]}>
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Text>

            {/* Tab selector */}
            <View style={styles.segment}>
              <Pressable
                onPress={() => { setAuthMode('signin'); setSignupStep(0); }}
                style={[
                  styles.segItem,
                  { backgroundColor: authMode === 'signin' ? theme.primary : theme.cardAlt }
                ]}>
                <Text style={{ color: authMode === 'signin' ? '#fff' : theme.text, fontWeight: '600' }}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setAuthMode('signup'); setSignupStep(0); }}
                style={[
                  styles.segItem,
                  { backgroundColor: authMode === 'signup' ? theme.primary : theme.cardAlt }
                ]}>
                <Text style={{ color: authMode === 'signup' ? '#fff' : theme.text, fontWeight: '600' }}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {authMode === 'signin' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.textFaint}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, input]}
                  editable={!authBusy}
                />

                <Text style={[styles.label, { color: theme.textMuted, marginTop: 12 }]}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, input]}
                  editable={!authBusy}
                />

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setShowAuthModal(false)}
                    disabled={authBusy}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title={authBusy ? 'Please wait...' : 'Sign In'}
                    onPress={handleSignIn}
                    disabled={authBusy}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                {signupStep === 0 && (
                  <View>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="email@example.com"
                      placeholderTextColor={theme.textFaint}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={[styles.input, input]}
                      editable={!authBusy}
                    />

                    <View style={styles.modalButtons}>
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => setShowAuthModal(false)}
                        disabled={authBusy}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Button
                        title={authBusy ? 'Sending OTP…' : 'Send OTP'}
                        onPress={handleSendOTP}
                        disabled={authBusy}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {signupStep === 1 && (
                  <View>
                    <Text style={[styles.sub, { color: theme.textMuted, fontSize: 13, marginBottom: 8, lineHeight: 18 }]}>
                      Enter the 6-digit OTP code sent to {email}.
                    </Text>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Verification Code</Text>
                    <TextInput
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="6-digit code"
                      placeholderTextColor={theme.textFaint}
                      keyboardType="numeric"
                      style={[styles.input, input]}
                      editable={!authBusy}
                    />

                    <View style={styles.modalButtons}>
                      <Button
                        title="Back"
                        variant="outline"
                        onPress={() => setSignupStep(0)}
                        disabled={authBusy}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Button
                        title={authBusy ? 'Verifying…' : 'Verify OTP'}
                        onPress={handleVerifyOTP}
                        disabled={authBusy}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {signupStep === 2 && (
                  <View>
                    <Text style={[styles.sub, { color: theme.textMuted, fontSize: 13, marginBottom: 8, lineHeight: 18 }]}>
                      Email verified! Set a password for password-based logins.
                    </Text>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Choose Password</Text>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="min 6 characters"
                      placeholderTextColor={theme.textFaint}
                      secureTextEntry
                      style={[styles.input, input]}
                      editable={!authBusy}
                    />

                    <View style={styles.modalButtons}>
                      <Button
                        title={authBusy ? 'Completing…' : 'Complete Signup'}
                        onPress={handleSetPassword}
                        disabled={authBusy}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: { fontSize: 20, fontWeight: '800' },
  signInBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  segItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
