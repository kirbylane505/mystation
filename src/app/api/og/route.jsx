import { ImageResponse } from 'next/og';
import { tracks, albums } from '@/data/tracks';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const songId = searchParams.get('id');

  const track = songId ? tracks.find(t => String(t.id) === String(songId)) : null;
  const album = track ? albums.find(a => a.id === track.albumId) : null;

  const title = track ? track.title : 'MyStation';
  const artist = track ? `Mike Page${track.featured ? ` ft. ${track.featured}` : ''}` : 'Mike Page Foundation';
  const albumName = track ? track.album : 'Stream Free';
  const year = track?.year || '2026';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2042 50%, #0a1628 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Blue accent orb */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
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
              gap: '12px',
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
              fontSize: track ? '64px' : '80px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '16px',
              maxWidth: '900px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
            }}
          >
            {albumName} • {year}
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '50px',
              width: 'fit-content',
            }}
          >
            <span style={{ fontSize: '20px' }}>▶</span>
            <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>
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
