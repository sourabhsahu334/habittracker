// Background cloud sync (Feature 15).
//
// Strategy: last-write-wins per record using `updatedAt`. We push all local
// records (including tombstones) and pull all remote records for the signed-in
// user, then merge by taking whichever side has the newer `updatedAt`. Nothing
// is ever silently deleted — deletes travel as tombstones (`deleted: true`).
//
// This runs only when: Supabase is configured, the user is signed in, and the
// network is available. Any failure is swallowed so the app keeps working
// offline; the next successful sync reconciles everything.

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  getAllEntriesRaw,
  saveAllEntriesRaw,
  getAllHabitsRaw,
  saveAllHabitsRaw,
  getHabitLogs,
  saveAllHabitLogsRaw,
  getProfile,
  saveProfile,
  getMeta,
  saveMeta,
} from '../storage/repository';

// Merge two record arrays by id, keeping the one with the newer updatedAt.
function mergeById(local, remote) {
  const map = new Map();
  for (const r of local) map.set(r.id, r);
  for (const r of remote) {
    const existing = map.get(r.id);
    if (!existing || (r.updatedAt || 0) > (existing.updatedAt || 0)) {
      map.set(r.id, r);
    }
  }
  return Array.from(map.values());
}

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

// Pushes local rows and pulls remote rows for one table, merges, persists.
async function syncTable({ table, userId, loadLocal, saveLocal }) {
  const local = await loadLocal();

  // Push local rows (upsert). Supabase table has a composite/primary key on id.
  if (local.length > 0) {
    const rows = local.map(r => ({ ...r, user_id: userId }));
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  // Pull all remote rows for this user.
  const { data: remote, error: pullErr } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);
  if (pullErr) throw pullErr;

  const cleaned = (remote || []).map(({ user_id, ...rest }) => rest);
  const merged = mergeById(local, cleaned);
  await saveLocal(merged);
  return merged;
}

// Full sync of every collection. Returns { ok, reason?, syncedAt? }.
export async function runSync() {
  if (!isSupabaseConfigured) return { ok: false, reason: 'not_configured' };

  const session = await getSession();
  if (!session) return { ok: false, reason: 'not_signed_in' };

  // If there is no network the Supabase requests below simply reject and we
  // return { ok: false, reason: 'error' }; the app continues working locally.
  const userId = session.user.id;

  try {
    await syncTable({
      table: 'entries',
      userId,
      loadLocal: getAllEntriesRaw,
      saveLocal: saveAllEntriesRaw,
    });
    await syncTable({
      table: 'habits',
      userId,
      loadLocal: getAllHabitsRaw,
      saveLocal: saveAllHabitsRaw,
    });
    await syncTable({
      table: 'habit_logs',
      userId,
      loadLocal: getHabitLogs,
      saveLocal: saveAllHabitLogsRaw,
    });

    // Profile is a single row keyed by user id.
    const profile = await getProfile();
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ ...profile, id: userId, user_id: userId }, { onConflict: 'id' });
      if (error) throw error;
    }
    const { data: remoteProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (remoteProfile) {
      const localProfile = await getProfile();
      if (
        !localProfile ||
        (remoteProfile.updatedAt || 0) > (localProfile.updatedAt || 0)
      ) {
        const { id, user_id, ...rest } = remoteProfile;
        await saveProfile(rest);
      }
    }

    const meta = await getMeta();
    const syncedAt = Date.now();
    await saveMeta({ ...meta, lastSyncAt: syncedAt, userId });
    return { ok: true, syncedAt };
  } catch (e) {
    return { ok: false, reason: 'error', error: String(e?.message || e) };
  }
}
