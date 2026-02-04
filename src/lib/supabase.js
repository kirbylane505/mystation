/**
 * Supabase Client - Database & Auth
 * MyStation Backend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in demo mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helpers
export const signUp = async (email, password, name) => {
  if (!supabase) return { error: { message: 'Demo mode - no backend' } };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  if (!supabase) return { error: { message: 'Demo mode - no backend' } };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUser = async () => {
  if (!supabase) return { user: null };

  const { data: { user } } = await supabase.auth.getUser();
  return { user };
};

// Database helpers
export const trackPlay = async (trackId, userId = null) => {
  if (!supabase) return;

  await supabase.from('plays').insert({
    track_id: trackId,
    user_id: userId,
    played_at: new Date().toISOString()
  });
};

export const getPlayCounts = async () => {
  if (!supabase) return {};

  const { data } = await supabase
    .from('plays')
    .select('track_id')
    .then(res => {
      const counts = {};
      res.data?.forEach(play => {
        counts[play.track_id] = (counts[play.track_id] || 0) + 1;
      });
      return { data: counts };
    });

  return data || {};
};

export default supabase;
