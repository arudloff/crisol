// CRISOL — Supabase client initialization
import { state, SUPABASE_URL, SUPABASE_KEY } from './state.js';

try {
  if (window.supabase && window.supabase.createClient) {
    state.sdb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    state.syncEnabled = true;
  }
} catch(e) { console.error('Supabase init error:', e); }
