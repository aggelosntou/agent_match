import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ykdjehardgppaqethjsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZGplaGFyZGdwcGFxZXRoanNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzA5NDEsImV4cCI6MjA5MTkwNjk0MX0.VHiud8KH3jTfw8sDlKAXChUj1_rEQ-M0wNIkdd9uPDc';

// On web, use localStorage. On native, use AsyncStorage.
// Guards against `window is not defined` during SSR.
const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
  setItem: (key: string, value: string) =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.setItem(key, value) : undefined),
  removeItem: (key: string) =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.removeItem(key) : undefined),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
