/**
 * Normalizes video URLs (YouTube, Vimeo) into their proper embeddable iframe formats.
 */
export function formatVideoEmbedUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. YouTube conversions
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID&feature=...
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const ytRegex = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // 2. Vimeo conversions
  // Matches:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

/**
 * Builds an iframe-safe src with optional autoplay or other query parameters.
 */
export function buildEmbedSrc(url: string, isPlaying: boolean = false): string {
  const embed = formatVideoEmbedUrl(url);
  if (!embed) return "";
  const sep = embed.includes("?") ? "&" : "?";
  return `${embed}${sep}autoplay=${isPlaying ? 1 : 0}`;
}
