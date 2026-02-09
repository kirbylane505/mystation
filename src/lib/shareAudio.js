/**
 * Share MP3 audio file via native share sheet or direct download fallback
 */
export async function shareMP3(track) {
  const response = await fetch(track.audioFile);
  const blob = await response.blob();
  const fileName = `${track.title} - Mike Page.mp3`;
  const file = new File([blob], fileName, { type: 'audio/mpeg' });
  const songUrl = `https://mystationlive.com/song/${track.id}`;

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `${track.title} - Mike Page`,
      text: `🎵 "${track.title}" - Mike Page\n\n🎧 Stream more: ${songUrl}`,
    });
    return 'shared';
  } else {
    // Fallback: direct download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }
}
