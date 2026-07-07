import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as repo from '../storage/repository';
import { runSync } from '../sync/syncService';

// Single source of truth for app data. Screens read from here and call the
// action methods to mutate; every mutation persists locally first (offline-
// first) and then kicks off a best-effort background sync.

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [meta, setMeta] = useState({});
  const [syncing, setSyncing] = useState(false);

  const reload = useCallback(async () => {
    const [p, s, e, h, hl, m] = await Promise.all([
      repo.getProfile(),
      repo.getSubjects(),
      repo.getEntries(),
      repo.getHabits(),
      repo.getHabitLogs(),
      repo.getMeta(),
    ]);
    setProfile(p);
    setSubjects(s);
    setEntries(e);
    setHabits(h);
    setHabitLogs(hl);
    setMeta(m);
  }, []);

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  // Fire-and-forget sync; refresh local state afterwards in case cloud had
  // newer data. Never blocks the UI.
  const backgroundSync = useCallback(async () => {
    setSyncing(true);
    const result = await runSync();
    if (result.ok) await reload();
    setSyncing(false);
    return result;
  }, [reload]);

  // ---- Actions ----

  const completeOnboarding = useCallback(
    async ({ profile: p, subjects: subjectNames }) => {
      const subjectList = subjectNames.map(name => ({
        id: repo.newId(),
        name,
      }));
      await repo.saveSubjects(subjectList);
      await repo.saveProfile({ ...p, onboardedAt: Date.now() });
      await reload();
      backgroundSync();
    },
    [reload, backgroundSync],
  );

  const updateProfile = useCallback(
    async patch => {
      const next = { ...(profile || {}), ...patch };
      await repo.saveProfile(next);
      setProfile(next);
      backgroundSync();
    },
    [profile, backgroundSync],
  );

  const setSubjectList = useCallback(
    async names => {
      // Preserve ids for names that already exist.
      const existing = new Map(subjects.map(s => [s.name, s.id]));
      const list = names.map(name => ({
        id: existing.get(name) || repo.newId(),
        name,
      }));
      await repo.saveSubjects(list);
      setSubjects(list);
      backgroundSync();
    },
    [subjects, backgroundSync],
  );

  const saveEntry = useCallback(
    async entry => {
      const next = await repo.upsertEntry(entry);
      setEntries(next);
      backgroundSync();
    },
    [backgroundSync],
  );

  const removeEntry = useCallback(
    async id => {
      const next = await repo.deleteEntry(id);
      setEntries(next);
      backgroundSync();
    },
    [backgroundSync],
  );

  const saveHabit = useCallback(
    async habit => {
      const next = await repo.upsertHabit(habit);
      setHabits(next);
      backgroundSync();
    },
    [backgroundSync],
  );

  const removeHabit = useCallback(
    async id => {
      const next = await repo.deleteHabit(id);
      setHabits(next);
      backgroundSync();
    },
    [backgroundSync],
  );

  const logHabit = useCallback(
    async (habitId, dateKey, value) => {
      const next = await repo.setHabitLog(habitId, dateKey, value);
      setHabitLogs(next);
      backgroundSync();
    },
    [backgroundSync],
  );

  const resetAllData = useCallback(async () => {
    await repo.resetAll();
    await reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      loading,
      profile,
      subjects,
      entries,
      habits,
      habitLogs,
      meta,
      syncing,
      completeOnboarding,
      updateProfile,
      setSubjectList,
      saveEntry,
      removeEntry,
      saveHabit,
      removeHabit,
      logHabit,
      resetAllData,
      backgroundSync,
      reload,
    }),
    [
      loading,
      profile,
      subjects,
      entries,
      habits,
      habitLogs,
      meta,
      syncing,
      completeOnboarding,
      updateProfile,
      setSubjectList,
      saveEntry,
      removeEntry,
      saveHabit,
      removeHabit,
      logHabit,
      resetAllData,
      backgroundSync,
      reload,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
