/**
 * Allow only http(s) URLs (and relative paths / data / blob for app assets).
 * Blocks javascript:, data:text/html, etc. for user-controlled href/src.
 */
export function safeUrl(value, { allowRelative = true, allowDataImage = true } = {}) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (allowRelative && (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../'))) {
    // Reject protocol-relative URLs (//evil.com) and scheme tricks
    if (raw.startsWith('//') || raw.toLowerCase().startsWith('/\\')) return null;
    if (/^[.]{0,2}\/[^/]*:/i.test(raw)) return null;
    return raw;
  }

  if (allowDataImage && /^data:image\/[a-z0-9+.-]+;base64,/i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('blob:')) {
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}
