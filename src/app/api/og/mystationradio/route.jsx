import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get('station') || 'Mike Page';
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#0a0a0a 0%,#1a0f05 50%,#0a0a0a 100%)',
          color: '#FFD700',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: 8, marginBottom: 20 }}>MYSTATION</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: '#FFD700', textAlign: 'center' }}>
          {station.toUpperCase()}
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', marginTop: 10 }}>RADIO</div>
        <div style={{ fontSize: 28, color: '#fff', opacity: 0.7, marginTop: 40 }}>
          24/7 · Every artist. Every track.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
