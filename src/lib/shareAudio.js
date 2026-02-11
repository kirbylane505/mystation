/**
 * Share song link via native share sheet (NO MP3 download)
 * Audio files are protected — only stream links are shared
 */
export async function shareMP3(track) {
  const songUrl = `https://mystationlive.com/song/${track.id}`;

  if (navigator.share) {
    await navigator.share({
      title: `${track.title} - Mike Page`,
      text: `🎵 "${track.title}" - Mike Page\n\n🎧 Stream free on MyStation:`,
      url: songUrl,
    });
    return 'shared';
  } else {
    // Fallback: copy link
    await navigator.clipboard.writeText(songUrl);
    return 'copied';
  }
}
