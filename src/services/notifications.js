// Local evening reminder (Feature 13).
//
// This must work with NO server — using OS-level local notifications only.
// To keep the base project buildable without extra native modules, this file
// ships as a safe no-op interface. Enable real notifications by installing a
// local-notification library and filling in the three functions below. No
// other app code needs to change — the Settings screen already calls these.
//
// Recommended: @notifee/react-native (supports repeating triggers + timezone).
//   1. yarn add @notifee/react-native  (then `cd ios && pod install`)
//   2. Uncomment the notifee blocks below.
//
// Behaviour we want: every day at `hour:minute`, if the user has NOT logged an
// entry that day, fire "Don't forget to log today's study session." Because a
// purely time-based OS trigger can't check today's log at fire time, the app
// re-arms the reminder on every launch/entry: if today is already logged we
// schedule for tomorrow, otherwise for today at the target time.

// import notifee, { RepeatFrequency, TriggerType } from '@notifee/react-native';

const REMINDER_ID = 'studylog-daily-reminder';

export async function requestPermission() {
  // return (await notifee.requestPermission()).authorizationStatus >= 1;
  return false;
}

// nextFireDate: JS Date for when the reminder should next fire.
export async function scheduleDailyReminder(nextFireDate, message) {
  void message;
  if (!nextFireDate) return;
  // await notifee.createTriggerNotification(
  //   {
  //     id: REMINDER_ID,
  //     title: 'StudyLog',
  //     body: message || "Don't forget to log today's study session.",
  //     android: { channelId: 'reminders' },
  //   },
  //   {
  //     type: TriggerType.TIMESTAMP,
  //     timestamp: nextFireDate.getTime(),
  //     repeatFrequency: RepeatFrequency.DAILY,
  //   },
  // );
}

export async function cancelReminder() {
  void REMINDER_ID;
  // await notifee.cancelTriggerNotification(REMINDER_ID);
}

// Compute the next fire Date given a "HH:MM" time and whether today is logged.
export function computeNextFire(timeStr, todayLogged, now = new Date()) {
  const [h, m] = (timeStr || '21:00').split(':').map(Number);
  const fire = new Date(now);
  fire.setHours(h, m, 0, 0);
  if (todayLogged || fire <= now) {
    fire.setDate(fire.getDate() + 1);
  }
  return fire;
}
