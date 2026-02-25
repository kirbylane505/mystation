/**
 * MYSTATION - Session Heartbeat
 * Enforces concurrent device limits per subscription tier:
 *   - Free / Supporter / Premium: 1 device at a time
 *   - Diamond ($14.99): 2 devices at a time
 * Client pings every 30s. Oldest session is kicked when limit exceeded.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Active sessions: email -> [{ sessionToken, lastSeen }, ...]
if (!global._activeSessions) global._activeSessions = new Map();

const STALE_TIMEOUT = 5 * 60 * 1000; // 5 min — no heartbeat = dead session

// Max concurrent sessions per tier
function getMaxSessions(tier) {
  if (tier === 'diamond') return 2;
  return 1; // free, supporter, regular, premium — all 1 device
}

// Look up subscriber tier from Supabase
async function getTier(email) {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return 'free';
    const { data } = await supabase
      .from('subscribers')
      .select('tier, status, free_until')
      .eq('email', email)
      .single();
    if (!data) return 'free';
    if (data.status === 'active') return data.tier || 'regular';
    if (data.free_until && new Date(data.free_until) > new Date()) return data.tier || 'free';
    return 'free';
  } catch {
    return 'free';
  }
}

export async function POST(request) {
  try {
    const { email, sessionToken } = await request.json();

    if (!email) {
      return NextResponse.json({ valid: false, error: 'Email required' }, { status: 400 });
    }

    const sessions = global._activeSessions;
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();

    // Clean stale sessions for this email
    let emailSessions = sessions.get(normalizedEmail) || [];
    emailSessions = emailSessions.filter(s => now - s.lastSeen < STALE_TIMEOUT);

    // Get tier to determine max allowed sessions
    const tier = await getTier(normalizedEmail);
    const maxSessions = getMaxSessions(tier);

    // New login — no session token (first heartbeat after login)
    if (!sessionToken) {
      const newToken = randomUUID();
      const newSession = { sessionToken: newToken, lastSeen: now };

      // If at limit, kick the OLDEST session
      if (emailSessions.length >= maxSessions) {
        // Sort oldest first, keep only (maxSessions - 1) newest
        emailSessions.sort((a, b) => b.lastSeen - a.lastSeen);
        emailSessions = emailSessions.slice(0, maxSessions - 1);
      }

      emailSessions.push(newSession);
      sessions.set(normalizedEmail, emailSessions);

      return NextResponse.json({ valid: true, sessionToken: newToken, tier, maxSessions });
    }

    // Heartbeat — check if this session token is still in the active list
    const mySession = emailSessions.find(s => s.sessionToken === sessionToken);

    if (!mySession) {
      // This session was kicked by a newer login
      return NextResponse.json({
        valid: false,
        kicked: true,
        message: maxSessions === 1
          ? 'This account is signed in on another device. Upgrade to Diamond for 2 devices.'
          : 'Too many active sessions. One of your sessions was signed out.',
      });
    }

    // Update last seen for this session
    mySession.lastSeen = now;
    sessions.set(normalizedEmail, emailSessions);

    // Global cleanup — remove stale entries from all emails
    for (const [key, val] of sessions) {
      const fresh = val.filter(s => now - s.lastSeen < STALE_TIMEOUT);
      if (fresh.length === 0) sessions.delete(key);
      else sessions.set(key, fresh);
    }

    return NextResponse.json({ valid: true, sessionToken, tier, maxSessions });
  } catch {
    return NextResponse.json({ valid: true, sessionToken: null });
  }
}
