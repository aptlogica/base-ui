import { describe, it, expect } from 'vitest';
import { cleanRichTextContent } from '../tooltipTextUtils';

describe('cleanRichTextContent', () => {
  it('should strip HTML tags and decode entities', () => {
    const input = '<p>Hello &amp; goodbye &quot;world&quot;</p>';
    const result = cleanRichTextContent(input);
    expect(result).toBe('Hello & goodbye "world"');
  });

  it('should handle empty or invalid input', () => {
    expect(cleanRichTextContent('')).toBe('');
    expect(cleanRichTextContent(null as any)).toBe('');
    expect(cleanRichTextContent(undefined as any)).toBe('');
  });

  it('should handle complex HTML with entities', () => {
    const input = '<div><span>&lt;script&gt;</span>&nbsp;&amp;&nbsp;<b>bold</b></div>';
    const result = cleanRichTextContent(input);
    // Note: &lt; and &gt; are intentionally not decoded for security
    expect(result).toBe('&lt;script&gt; & bold');
  });

  it('should collapse whitespace', () => {
    const input = '<p>  Multiple    spaces  </p>';  
    const result = cleanRichTextContent(input);
    expect(result).toBe('Multiple spaces');
  });
});