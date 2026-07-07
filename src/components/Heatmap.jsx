import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { addDays, dayKey, parseDayKey } from '../utils/date';

// Calendar heatmap of the last `days` days (Feature 5). Cell color intensity
// reflects hours studied that day; empty days use the lightest shade so gaps
// are also visible (Feature 20 missed-day tracker). Tapping a cell calls
// onSelectDay(dateKey).

function intensityIndex(hours, maxHours, buckets) {
  if (!hours || hours <= 0) return 0;
  if (maxHours <= 0) return 1;
  const ratio = hours / maxHours;
  // Map (0,1] into buckets 1..buckets-1.
  return Math.min(buckets - 1, 1 + Math.floor(ratio * (buckets - 2 + 0.999)));
}

export default function Heatmap({ hoursByDay, days = 84, onSelectDay, selectedKey }) {
  const { theme } = useTheme();
  const today = new Date();
  const start = addDays(today, -(days - 1));

  const keys = Array.from({ length: days }, (_, i) => dayKey(addDays(start, i)));
  const maxHours = Math.max(0, ...keys.map(k => hoursByDay[k] || 0));

  // Arrange into weeks (columns) of 7 rows (Mon..Sun), GitHub-style.
  // Pad the front so the first column starts on Monday.
  const firstDay = parseDayKey(keys[0]);
  const jsDow = firstDay.getDay(); // 0 Sun..6 Sat
  const padFront = jsDow === 0 ? 6 : jsDow - 1;
  const cells = [...Array(padFront).fill(null), ...keys];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((k, di) => {
              if (!k) return <View key={di} style={styles.cell} />;
              const hours = hoursByDay[k] || 0;
              const idx = intensityIndex(hours, maxHours, theme.heat.length);
              const selected = k === selectedKey;
              return (
                <Pressable
                  key={di}
                  onPress={() => onSelectDay && onSelectDay(k)}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: theme.heat[idx],
                      borderColor: selected ? theme.primary : 'transparent',
                      borderWidth: selected ? 2 : 0,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textFaint }]}>Less</Text>
        {theme.heat.map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={[styles.legendText, { color: theme.textFaint }]}>More</Text>
      </View>
    </View>
  );
}

const CELL = 15;
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  week: { marginRight: 4 },
  cell: { width: CELL, height: CELL, borderRadius: 4, marginBottom: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 3 },
  legendCell: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, marginHorizontal: 4 },
});
