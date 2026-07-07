// Supabase client (Feature 15 — cloud sync).
//
// Cloud sync is OPTIONAL and secondary. The app is fully functional with no
// Supabase project configured and no internet. Fill in your project URL and
// anon key below (or wire them to a config/env). If left blank, the app runs
// in local-only mode and every sync call becomes a no-op.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lgvizhpaczvvctivdjie.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxndml6aHBhY3p2dmN0aXZkamllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDA3NDgsImV4cCI6MjA5ODk3Njc0OH0.WYkt0kxrpLZN3DlqKNg2UNw1tLDvMvRNyH0Xys1LVuc'

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
