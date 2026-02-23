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
        }}
      >
        {/* Blue accent orbs */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            bottom: '-50px',
            right: '-50px',
            display: 'flex',
          }}
        />

        {/* IDMG Circle Logo — right side */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mystationlive.com/images/idmg-logo-white.png"
          alt=""
          width="360"
          height="360"
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.4,
            borderRadius: '50%',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
            width: '100%',
          }}
        >
          {/* MYSTATION brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '12px',
              }}
            >
              🎵
            </div>
            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, letterSpacing: '2px' }}>
              MY
            </span>
            <span style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 800, letterSpacing: '2px' }}>
              STATION
            </span>
          </div>

          {/* Song title */}
          <div
            style={{
              fontSize: title.length > 20 ? '52px' : '64px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '16px',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* Artist */}
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '8px',
              display: 'flex',
            }}
          >
            {artist}
          </div>

          {/* Album + Year */}
          <div
            style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '40px',
              display: 'flex',
            }}
          >
            {album} • {year}
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '50px',
              width: '280px',
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '12px', display: 'flex' }}>▶</span>
            <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, letterSpacing: '2px', display: 'flex' }}>
              STREAM FREE
            </span>
          </div>
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
