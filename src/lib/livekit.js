/**
 * MYSTATION - LiveKit Server Helper
 * Token generation and room management for PodStation
 */

import { AccessToken, RoomServiceClient, WebhookReceiver, EgressClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY?.trim();
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET?.trim();
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim().replace('wss://', 'https://');

export async function createToken(roomName, participantName, isPublisher = false) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    ttl: '6h',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isPublisher,
    canSubscribe: true,
    canPublishData: true,
  });

  return await token.toJwt();
}

export function getRoomService() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

export async function listActiveRooms() {
  try {
    const roomService = getRoomService();
    const rooms = await roomService.listRooms();
    return rooms;
  } catch (err) {
    console.error('Failed to list rooms:', err);
    return [];
  }
}

export function getWebhookReceiver() {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

export function getEgressClient() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}
