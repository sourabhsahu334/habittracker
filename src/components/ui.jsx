import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// Small reusable primitives shared across screens. Everything is theme-aware.

export function Card({ children, style }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>
      {right}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const { theme } = useTheme();
  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
      ? theme.danger
      : 'transparent';
  const fg =
    variant === 'ghost' ? theme.primary : variant === 'outline' ? theme.text : '#fff';
  const border = variant === 'outline' ? theme.border : 'transparent';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

// Increment/decrement stepper (Features 2, 9). Renders a value between two
// round tap targets. `format` lets callers show "2.5h" etc.
export function Stepper({ value, onChange, step = 1, min = 0, max, format, label }) {
  const { theme } = useTheme();
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(max != null ? Math.min(max, round(value + step)) : round(value + step));
  return (
    <View>
      {label ? (
        <Text style={[styles.stepperLabel, { color: theme.textMuted }]}>{label}</Text>
      ) : null}
      <View style={styles.stepperRow}>
        <StepBtn label="–" onPress={dec} theme={theme} />
        <Text style={[styles.stepperValue, { color: theme.text }]}>
          {format ? format(value) : value}
        </Text>
        <StepBtn label="+" onPress={inc} theme={theme} />
      </View>
    </View>
  );
}

function StepBtn({ label, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepBtn,
        { backgroundColor: theme.primarySoft, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text style={[styles.stepBtnText, { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// Horizontal progress bar (Feature 9 goal tracking).
export function ProgressBar({ progress, color }) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.cardAlt }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct * 100}%`, backgroundColor: color || theme.primary },
        ]}
      />
    </View>
  );
}

// Vertical bar chart from plain Views (no native SVG). data: [{ label, value }]
export function BarChart({ data, color, height = 120, highlightIndex }) {
  const { theme } = useTheme();
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={[styles.barChart, { height }]}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 24);
        const isHi = i === highlightIndex;
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barValueWrap}>
              {d.value > 0 ? (
                <Text style={[styles.barValue, { color: theme.textFaint }]}>
                  {round(d.value)}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                width: '62%',
                height: Math.max(2, h),
                borderRadius: 5,
                backgroundColor: isHi ? theme.accent : color || theme.primary,
                opacity: d.value > 0 ? 1 : 0.25,
              }}
            />
            <Text style={[styles.barLabel, { color: theme.textMuted }]}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Horizontal stacked distribution bar for subject breakdown (Feature 7).
export function StackedBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <View style={styles.stacked}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            flex: s.value / total,
            backgroundColor: s.color,
            minWidth: s.value > 0 ? 3 : 0,
          }}
        />
      ))}
    </View>
  );
}

export function Pill({ text, color, bg }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: bg || theme.cardAlt }]}>
      <Text style={[styles.pillText, { color: color || theme.textMuted }]}>{text}</Text>
    </View>
  );
}

export function Loader() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loader, { backgroundColor: theme.bg }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  const { theme } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySub, { color: theme.textMuted }]}>{subtitle}</Text>
      ) : null}
      {action}
    </View>
  );
}

// Distinct-ish colors for subjects, derived deterministically from index.
export const SUBJECT_COLORS = [
  '#4C5BD4', '#2BB673', '#E5A400', '#E0533D', '#8A56D4',
  '#2AA6C4', '#D44C9B', '#66A83A', '#C46A2A', '#5A6270',
];
export function subjectColor(i) {
  return SUBJECT_COLORS[i % SUBJECT_COLORS.length];
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  stepperLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 24, fontWeight: '700', marginTop: -2 },
  stepperValue: { fontSize: 22, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%', borderRadius: 5 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barValueWrap: { height: 14, justifyContent: 'flex-end' },
  barValue: { fontSize: 9, marginBottom: 2 },
  barLabel: { fontSize: 10, marginTop: 5 },
  stacked: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', width: '100%' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
