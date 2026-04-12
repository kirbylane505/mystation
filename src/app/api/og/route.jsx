import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'MyStation';
  const artist = searchParams.get('artist') || 'Mike Page';
  const album = searchParams.get('album') || 'Stream Free';
  const year = searchParams.get('year') || '2026';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2042 50%, #0a1628 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glow behind play button */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 65%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        />

        {/* Left side — song info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '50px 60px',
            width: '55%',
          }}
        >
          {/* MYSTATION brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginRight: '10px',
              }}
            >
              🎵
            </div>
            <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, letterSpacing: '2px' }}>
              MY
            </span>
            <span style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 800, letterSpacing: '2px' }}>
              STATION
            </span>
          </div>

          {/* Song title */}
          <div
            style={{
              fontSize: title.length > 25 ? '44px' : title.length > 15 ? '52px' : '60px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '12px',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* Artist */}
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px',
              display: 'flex',
            }}
          >
            {artist}
          </div>

          {/* Album + Year */}
          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
            }}
          >
            {album} • {year}
          </div>
        </div>

        {/* Right side — MASSIVE play button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45%',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 60px rgba(59,130,246,0.7), 0 0 120px rgba(59,130,246,0.3)',
              border: '4px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ fontSize: '90px', color: '#fff', marginLeft: '16px', display: 'flex' }}>▶</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '22px', fontWeight: 700, letterSpacing: '4px', display: 'flex' }}>
            TAP TO PLAY
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
