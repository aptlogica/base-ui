const SAFE_IMAGE_DATA_PREFIXES = [
  'data:image/png',
  'data:image/jpeg',
  'data:image/jpg',
  'data:image/gif',
  'data:image/webp',
  'data:image/svg+xml',
];

const isSafeHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const sanitizeExternalUrl = (raw: string | null | undefined): string | null => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  if (!isSafeHttpUrl(candidate)) return null;

  return candidate;
};

export const sanitizeImageSrc = (raw: string | null | undefined): string => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('blob:')) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'blob:') return '';
      if (typeof globalThis !== 'undefined' && globalThis.location?.origin) {
        if (url.origin !== globalThis.location.origin) return '';
      }
      return trimmed;
    } catch {
      return '';
    }
  }

  if (trimmed.startsWith('data:')) {
    return '';
  }

  return isSafeHttpUrl(trimmed) ? trimmed : '';
};
