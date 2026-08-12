const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.eazybuy.org/api';

function apiOrigin(): string {
  return API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function mediaPathFromUri(uri: string): string | null {
  const match = uri.match(/\/(?:api\/media|storage)\/(.+)$/i);
  if (match?.[1]) return match[1].replace(/^\/+/, '');
  if (!uri.includes('://') && !uri.startsWith('file:') && !uri.startsWith('content:')) {
    return uri.replace(/^\/+/, '').replace(/^storage\//, '');
  }
  return null;
}

/** Make storage / product image URLs reachable from the device. */
export function resolveMediaUrl(uri?: string | null): string | undefined {
  if (!uri) return undefined;
  const trimmed = uri.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }

  const origin = apiOrigin();
  const path = mediaPathFromUri(trimmed);
  if (origin && path) {
    return `${origin}/api/media/${path}`;
  }

  return trimmed;
}
