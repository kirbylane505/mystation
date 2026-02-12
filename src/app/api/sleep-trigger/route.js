/**
 * Sleep Trigger API
 * Records when the sleep timer fires so local agents can detect it.
 * The actual computer sleep is handled by a local script/agent.
 */

import { NextResponse } from 'next/server';

// Store the latest sleep trigger timestamp
let lastSleepTrigger = null;

export async function POST() {
  lastSleepTrigger = new Date().toISOString();
  return NextResponse.json({
    triggered: true,
    timestamp: lastSleepTrigger,
    message: 'Sleep signal sent. Local agents should put your computer to sleep.'
  });
}

export async function GET() {
  return NextResponse.json({
    lastTrigger: lastSleepTrigger,
    active: lastSleepTrigger ? (Date.now() - new Date(lastSleepTrigger).getTime() < 60000) : false
  });
}
