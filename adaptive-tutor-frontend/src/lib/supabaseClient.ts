import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment configuration.');
}

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
