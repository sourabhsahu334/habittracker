# StudyLog

A simple, **offline-first** daily study tracker for students (JEE/NEET, UPSC,
boards, college, or any custom exam). Students manually log what they studied
each day — subject, hours, questions solved — and the app visualizes their
consistency and progress. **It provides no study content, tips, or AI
schedules** — it only records and visualizes.

Built with **React Native 0.86 (JSX)**, local storage on device as the source
of truth, and **Supabase** for optional cloud backup/sync.

## Architecture

```
index.js                → registers the app, loads url-polyfill for Supabase
App.jsx                 → providers: SafeArea → Theme → App state → Navigation
src/
  navigation/           → bottom tabs (Home/Progress/Log/History/Settings) + modals
  screens/              → one screen per major surface
  components/           → shared UI (Card, Stepper, BarChart, Heatmap, HabitSection…)
  state/AppContext.jsx  → single source of truth; loads data, exposes actions
  storage/repository.js → structured records over AsyncStorage (offline-first)
  sync/syncService.js   → last-write-wins cloud sync
  supabase/client.js    → Supabase client (fill in URL + key)
  services/             → notifications (reminders) + CSV export
  utils/                → pure date + stats helpers (unit-tested)
  theme/                → light/dark palettes + provider
  constants/            → exam-category subject presets
supabase/schema.sql     → run this in Supabase to enable cloud sync
```

**Offline-first:** every mutation writes to local AsyncStorage first, then
fires a best-effort background sync. The app is fully functional with zero
internet and no Supabase project configured. Records carry `updatedAt` and a
soft-delete `deleted` tombstone so cloud sync merges last-write-wins and never
silently loses data.

## Feature coverage (v1)

| # | Feature | Status |
|---|---------|--------|
| 1 | Onboarding | ✅ |
| 2 | Daily manual entry (stepper) | ✅ |
| 3 | Multiple subjects per day | ✅ |
| 4 | Streak counter | ✅ |
| 5 | Calendar heatmap | ✅ |
| 6 | Exam countdown | ✅ |
| 7 | Subject-wise breakdown | ✅ |
| 8 | Weekly stats | ✅ |
| 9 | Daily goal tracking | ✅ |
| 10 | History log (expand/collapse) | ✅ |
| 11 | Edit & delete past entries | ✅ |
| 12 | Weak subject flag | ✅ |
| 13 | Reminders/notifications | ⚙️ Interface wired; install a notification lib to activate (see below) |
| 14 | Offline-first local storage | ✅ |
| 15 | Cloud sync (Supabase) | ✅ Add URL/key + run schema.sql |
| 16 | Monthly progress report | ✅ |
| 17 | Best streak record | ✅ |
| 18 | Questions accuracy tracking | ✅ |
| 19 | Chapter/topic logging | ✅ |
| 20 | Missed day tracker | ✅ |
| 21 | Custom habit tracking | ✅ |
| 22 | Dark & light mode | ✅ |
| 23 | Export data (CSV via share sheet) | ✅ |
| 24 | Accountability partner | ⬜ Not yet built (needs shared read-only cloud view) |
| 25 | Home screen widget | ⬜ Not yet built (native widget module per platform) |

## Setup

```sh
npm install
# iOS only:
cd ios && bundle install && bundle exec pod install && cd ..
```

Run:

```sh
npm start          # Metro
npm run android    # or: npm run ios
```

Tests (pure logic — streaks, weekly stats, accuracy, weak-subject flags):

```sh
npm test
```

## Enabling Supabase cloud sync (Feature 15, optional)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). It
   creates the `profiles`, `entries`, `habits`, `habit_logs` tables with Row
   Level Security so each user only sees their own rows.
3. Put your project URL and anon key in [`src/supabase/client.js`](src/supabase/client.js).
4. In the app: **Settings → Cloud sync → Sign in / Sign up** (email + password).
   Data then syncs silently in the background and on demand via **Sync now**.

If you skip this, the app runs in local-only mode with no loss of functionality.

## Enabling local reminders (Feature 13)

The reminder scheduling interface lives in
[`src/services/notifications.js`](src/services/notifications.js) and currently
ships as a safe no-op so the base project builds without extra native modules.
To activate:

```sh
yarn add @notifee/react-native
cd ios && pod install
```

Then uncomment the `notifee` blocks in that file — no other app code changes.
The Settings screen already calls `scheduleDailyReminder` / `cancelReminder`
and re-arms the reminder for the next day whenever you log an entry.

## Not included (by design)

No Pomodoro/auto time-tracking, no study content/notes/videos, no AI
schedules, no in-app tips, no social feed, no ads.
