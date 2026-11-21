const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&fm=webp&q=75&w=640';

export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Converts Google Drive and Unsplash image URLs into fast, resized WebP URLs.
 * - Google Drive links -> `https://lh3.googleusercontent.com/d/<ID>=w<width>-rw` (WebP CDN)
 * - Unsplash links -> `?auto=format&fit=crop&fm=webp&q=75&w=<width>`
 */
export function optimizeImageUrl(
  rawUrl?: string | null,
  width: number = 640
): string {
  const url = (rawUrl || '').trim();
  if (!url) return FALLBACK_IMAGE;

  const driveId = extractDriveFileId(url);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}=w${width}-rw`;
  }

  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('fm', 'webp');
      parsed.searchParams.set('q', '75');
      parsed.searchParams.set('w', String(width));
      return parsed.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}auto=format&fit=crop&fm=webp&q=75&w=${width}`;
    }
  }

  return url;
}

export function buildWebpSrcSet(rawUrl?: string | null): string | undefined {
  const url = (rawUrl || '').trim();
  if (!url) return undefined;

  if (extractDriveFileId(url) || url.includes('images.unsplash.com')) {
    return [400, 640, 960]
      .map((w) => `${optimizeImageUrl(url, w)} ${w}w`)
      .join(', ');
  }

  return undefined;
}
