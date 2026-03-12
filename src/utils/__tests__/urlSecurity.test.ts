import { describe, expect, it } from 'vitest';
import { sanitizeExternalUrl, sanitizeImageSrc } from '../urlSecurity';

describe('sanitizeExternalUrl', () => {
  it('returns null for empty or whitespace values', () => {
    expect(sanitizeExternalUrl('')).toBeNull();
    expect(sanitizeExternalUrl('   ')).toBeNull();
    expect(sanitizeExternalUrl(null)).toBeNull();
    expect(sanitizeExternalUrl(undefined)).toBeNull();
  });

  it('allows http/https URLs', () => {
    expect(sanitizeExternalUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeExternalUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('adds https to protocol-less URLs', () => {
    expect(sanitizeExternalUrl('example.com')).toBe('https://example.com');
    expect(sanitizeExternalUrl('example.com/path')).toBe('https://example.com/path');
  });

  it('rejects unsafe protocols', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(sanitizeExternalUrl('ftp://example.com')).toBeNull();
  });
});

describe('sanitizeImageSrc', () => {
  it('returns empty string for empty values', () => {
    expect(sanitizeImageSrc('')).toBe('');
    expect(sanitizeImageSrc('   ')).toBe('');
    expect(sanitizeImageSrc(null)).toBe('');
    expect(sanitizeImageSrc(undefined)).toBe('');
  });

  it('allows http/https image URLs', () => {
    expect(sanitizeImageSrc('https://cdn.example.com/image.png')).toBe('https://cdn.example.com/image.png');
    expect(sanitizeImageSrc('http://cdn.example.com/image.jpg')).toBe('http://cdn.example.com/image.jpg');
  });

  it('allows blob URLs', () => {
    expect(sanitizeImageSrc('blob:http://localhost/1234')).toBe('blob:http://localhost/1234');
  });

  it('rejects data image URLs', () => {
    expect(sanitizeImageSrc('data:image/png;base64,abc')).toBe('');
    expect(sanitizeImageSrc('data:image/svg+xml;base64,abc')).toBe('');
  });

  it('rejects non-image data URLs and unsafe protocols', () => {
    expect(sanitizeImageSrc('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
    expect(sanitizeImageSrc('javascript:alert(1)')).toBe('');
  });
});
