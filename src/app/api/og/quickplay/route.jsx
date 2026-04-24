import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dedicated OG image for /quickplay — NO play button, MyStation logo instead.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '5 Track QuickPlay';
  const artist = searchParams.get('artist') || 'Mike Page · IDMG Mixtape';
  const album =
    searchParams.get('album') ||
    'I Want This One · R.U.N · Heaven\u2019s Gate · F.I.L.A. · Be Alright';
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
        {/* Soft glow behind logo */}
        <div
          style={{
            position: 'absolute',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 65%)',
            top: '50%',
            right: '10%',
            transform: 'translate(50%, -50%)',
            display: 'flex',
          }}
        />

        {/* Left — title, artist, tracklist */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '50px 60px',
            width: '58%',
          }}
        >
          {/* Brand word-mark */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            <span
              style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '3px',
              }}
            >
              MY
            </span>
            <span
              style={{
                color: '#3b82f6',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '3px',
              }}
            >
              STATION
            </span>
          </div>

          <div
            style={{
              fontSize: '70px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.0,
              marginBottom: '16px',
              display: 'flex',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: '30px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '10px',
              display: 'flex',
            }}
          >
            {artist}
          </div>

          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              marginTop: '8px',
            }}
          >
            {album}
          </div>

          <div
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
              marginTop: '6px',
            }}
          >
            {year}
          </div>
        </div>

        {/* Right — gold TAP-TO-PLAY button (visible in IG DMs where og:audio isn't supported) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42%',
            gap: '22px',
          }}
        >
          <div
            style={{
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 60%, #B8860B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 10px 70px rgba(255,215,0,0.65), 0 0 140px rgba(255,215,0,0.35), inset 0 0 40px rgba(255,255,255,0.25)',
              border: '6px solid rgba(255,255,255,0.25)',
            }}
          >
            {/* SVG play triangle (satori renders SVG natively) */}
            <svg width="140" height="140" viewBox="0 0 100 100" style={{ marginLeft: '12px' }}>
              <polygon points="25,15 25,85 85,50" fill="#0a0a0a" />
            </svg>
          </div>
          <span
            style={{
              color: '#FFD700',
              fontSize: '26px',
              fontWeight: 900,
              letterSpacing: '5px',
              display: 'flex',
              textShadow: '0 0 20px rgba(255,215,0,0.5)',
            }}
          >
            TAP TO PLAY
          </span>
        </div>

        {/* Bottom gradient bar */}
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
    { width: 1200, height: 630 }
  );
}
