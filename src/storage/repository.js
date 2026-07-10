// Offline-first local storage (Feature 14).
//
// AsyncStorage is a key-value engine, so we impose a *structured* record model
// on top of it: each collection (entries, subjects, habits, habitLogs) is a
// JSON document of records keyed by id. All read/query logic lives in
// src/utils/stats.js and operates on plain arrays, so the app is fully
// queryable in memory. Every mutable record carries `updatedAt` and a soft
// `deleted` tombstone so cloud sync (Feature 15) can do last-write-wins merges
// without ever losing data.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  profile: '@studylog/profile',
  subjects: '@studylog/subjects',
  entries: '@studylog/entries',
  habits: '@studylog/habits',
  habitLogs: '@studylog/habit_logs',
  meta: '@studylog/meta',
};

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

async function writeJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

// ---- Profile & meta -------------------------------------------------------

export const getProfile = () => readJSON(KEYS.profile, null);
export const saveProfile = p =>
  writeJSON(KEYS.profile, { ...p, updatedAt: Date.now() });

export const getMeta = () => readJSON(KEYS.meta, {});
export const saveMeta = m => writeJSON(KEYS.meta, m);

// ---- Subjects (array of { id, name }) -------------------------------------

export const getSubjects = () => readJSON(KEYS.subjects, []);
export const saveSubjects = list => writeJSON(KEYS.subjects, list);

// ---- Entries --------------------------------------------------------------
// Only non-deleted records are returned to the UI; tombstones are kept on disk
// for sync and filtered out here.

export async function getEntries() {
  let all = await readJSON(KEYS.entries, []);
  let changed = false;
  all = all.map(e => {
    if (!e.id || e.id === 'undefined' || e.id === 'null') {
      changed = true;
      return { ...e, id: newId() };
    }
    return e;
  });
  if (changed) {
    await writeJSON(KEYS.entries, all);
  }
  return all.filter(e => !e.deleted);
}

export async function getAllEntriesRaw() {
  let all = await readJSON(KEYS.entries, []);
  let changed = false;
  all = all.map(e => {
    if (!e.id || e.id === 'undefined' || e.id === 'null') {
      changed = true;
      return { ...e, id: newId() };
    }
    return e;
  });
  if (changed) {
    await writeJSON(KEYS.entries, all);
  }
  return all;
}

export async function upsertEntry(entry) {
  let all = await readJSON(KEYS.entries, []);
  const now = Date.now();
  
  // Repair any existing entries that have missing/invalid IDs
  let changed = false;
  all = all.map(e => {
    if (!e.id || e.id === 'undefined' || e.id === 'null') {
      changed = true;
      return { ...e, id: newId() };
    }
    return e;
  });

  const entryId = entry.id && entry.id !== 'undefined' && entry.id !== 'null' ? entry.id : newId();
  const idx = all.findIndex(e => e.id === entryId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...entry, id: entryId, updatedAt: now };
  } else {
    all.push({
      ...entry,
      id: entryId,
      deleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }
  await writeJSON(KEYS.entries, all);
  return all.filter(e => !e.deleted);
}

export async function deleteEntry(id) {
  const all = await readJSON(KEYS.entries, []);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], deleted: true, updatedAt: Date.now() };
  }
  await writeJSON(KEYS.entries, all);
  return all.filter(e => !e.deleted);
}

export const saveAllEntriesRaw = list => writeJSON(KEYS.entries, list);

// ---- Habits (Feature 21) --------------------------------------------------
// habits: [{ id, name, type: 'bool' | 'number', deleted, updatedAt }]
// habitLogs: [{ id, habitId, dateKey, value, updatedAt }]

export async function getHabits() {
  const all = await readJSON(KEYS.habits, []);
  return all.filter(h => !h.deleted);
}
export const getAllHabitsRaw = () => readJSON(KEYS.habits, []);

export async function upsertHabit(habit) {
  const all = await readJSON(KEYS.habits, []);
  const now = Date.now();
  const idx = all.findIndex(h => h.id === habit.id);
  if (idx >= 0) all[idx] = { ...all[idx], ...habit, updatedAt: now };
  else all.push({ id: newId(), deleted: false, updatedAt: now, ...habit });
  await writeJSON(KEYS.habits, all);
  return all.filter(h => !h.deleted);
}

export async function deleteHabit(id) {
  const all = await readJSON(KEYS.habits, []);
  const idx = all.findIndex(h => h.id === id);
  if (idx >= 0) all[idx] = { ...all[idx], deleted: true, updatedAt: Date.now() };
  await writeJSON(KEYS.habits, all);
  return all.filter(h => !h.deleted);
}

export const getHabitLogs = () => readJSON(KEYS.habitLogs, []);
export const saveAllHabitsRaw = list => writeJSON(KEYS.habits, list);
export const saveAllHabitLogsRaw = list => writeJSON(KEYS.habitLogs, list);

export async function setHabitLog(habitId, dateKey, value) {
  const all = await readJSON(KEYS.habitLogs, []);
  const idx = all.findIndex(l => l.habitId === habitId && l.dateKey === dateKey);
  const now = Date.now();
  if (idx >= 0) all[idx] = { ...all[idx], value, updatedAt: now };
  else all.push({ id: newId(), habitId, dateKey, value, updatedAt: now });
  await writeJSON(KEYS.habitLogs, all);
  return all;
}

// ---- Reset (Feature 14 / settings) ----------------------------------------

export async function resetAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
