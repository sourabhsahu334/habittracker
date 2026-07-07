// Supabase client (Feature 15 — cloud sync).
//
// Cloud sync is OPTIONAL and secondary. The app is fully functional with no
// Supabase project configured and no internet. Fill in your project URL and
// anon key below (or wire them to a config/env). If left blank, the app runs
// in local-only mode and every sync call becomes a no-op.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = ''; // e.g. 'https://xxxx.supabase.co'
export const SUPABASE_ANON_KEY = ''; // e.g. 'eyJ...'

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // React Native has no URL to parse for OAuth redirects.
        detectSessionInUrl: false,
      },
    })
  : null;
