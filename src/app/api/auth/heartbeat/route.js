/**
 * MYSTATION - Session Heartbeat
 * Prevents same email from being signed in on multiple devices
 * Client pings every 30s. If another device pings with same email, older session is invalidated.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Active sessions: email -> { sessionToken, lastSeen, ip }
if (!global._activeSessions) global._activeSessions = new Map();

export async function POST(request) {
  try {
    const { email, sessionToken } = await request.json();

    if (!email) {
      return NextResponse.json({ valid: false, error: 'Email required' }, { status: 400 });
    }

    const sessions = global._activeSessions;
    const normalizedEmail = email.toLowerCase();
    const existing = sessions.get(normalizedEmail);

    // New login — no existing session or first heartbeat
    if (!sessionToken) {
      const newToken = randomUUID();
      sessions.set(normalizedEmail, {
        sessionToken: newToken,
        lastSeen: Date.now(),
      });
      return NextResponse.json({ valid: true, sessionToken: newToken });
    }

    // Heartbeat — check if this session is still the active one
    if (existing && existing.sessionToken !== sessionToken) {
      // Another device took over — invalidate this session
      return NextResponse.json({
        valid: false,
        kicked: true,
        message: 'This account is signed in on another device.',
      });
    }

    // Update last seen
    sessions.set(normalizedEmail, {
      sessionToken,
      lastSeen: Date.now(),
    });

    // Clean stale sessions (>5 min no heartbeat)
    const now = Date.now();
    for (const [key, val] of sessions) {
      if (now - val.lastSeen > 5 * 60 * 1000) sessions.delete(key);
    }

    return NextResponse.json({ valid: true, sessionToken });
  } catch {
    return NextResponse.json({ valid: true, sessionToken: null });
  }
}
