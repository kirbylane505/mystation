import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MyStation - Stream Mike Page Music Free';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #070d17 0%, #0d1929 40%, #111d33 60%, #070d17 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <img
          src="https://mystationlive.com/images/mystation-logo.png"
          width="220"
          height="220"
          style={{
            borderRadius: '20px',
            boxShadow: '0 0 60px rgba(96, 165, 250, 0.15)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 28,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-1px',
          }}
        >
          <span style={{ color: '#ffffff' }}>MY</span>
          <span style={{ color: '#60a5fa' }}>STATION</span>
        </div>
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.45)',
            marginTop: 12,
          }}
        >
          Your Music. Your Station. No Limits.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 28,
            fontSize: 15,
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <span>100+ Tracks</span>
          <span style={{ color: 'rgba(96, 165, 250, 0.5)' }}>|</span>
          <span>Official Merch</span>
          <span style={{ color: 'rgba(96, 165, 250, 0.5)' }}>|</span>
          <span>LOTL Festival</span>
          <span style={{ color: 'rgba(96, 165, 250, 0.5)' }}>|</span>
          <span>IDMG</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
