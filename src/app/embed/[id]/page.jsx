/**
 * Embed player — lightweight audio player for OG/Twitter card embeds.
 * When platforms support og:audio or twitter:player, this page renders
 * a minimal player that plays the track and links to MyStation.
 */
import { tracks, albums } from '@/data/tracks';

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params }) {
  const { id } = params;
  const track = tracks.find(t => String(t.id) === String(id));

  if (!track) {
    return <div style={{ background: '#0a1628', color: '#fff', padding: 20 }}>Track not found</div>;
  }

  const album = albums.find(a => a.id === track.albumId);
  const audioUrl = track.audioFile?.startsWith('http')
    ? track.audioFile
    : `https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/${track.audioFile.replace(/^\/audio\//, '')}`;
  const songUrl = `https://mystationlive.com/song/${track.id}?shared=true`;

  return (
    <html>
      <body style={{ margin: 0, padding: 0, background: '#0a1628', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #0a1628, #0f2042)',
          height: 80,
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }} id="playBtn" onClick="togglePlay()">
            <span id="playIcon" style={{ fontSize: 20, color: '#fff', marginLeft: 3 }}>▶</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {track.artist || 'Mike Page'}
            </div>
          </div>
          <a href={songUrl} target="_blank" rel="noopener" style={{
            color: '#3b82f6',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            Open in MyStation →
          </a>
        </div>
        <audio id="audio" src={audioUrl} preload="none" />
        <script dangerouslySetInnerHTML={{ __html: `
          function togglePlay() {
            var a = document.getElementById('audio');
            var icon = document.getElementById('playIcon');
            if (a.paused) { a.play(); icon.textContent = '⏸'; }
            else { a.pause(); icon.textContent = '▶'; }
          }
          document.getElementById('playBtn').onclick = togglePlay;
        `}} />
      </body>
    </html>
  );
}
