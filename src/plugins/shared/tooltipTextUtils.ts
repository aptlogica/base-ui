const isWhitespace = (ch: string): boolean =>
  ch === ' ' ||
  ch === '\n' ||
  ch === '\r' ||
  ch === '\t' ||
  ch === '\f' ||
  ch === '\v';

function stripHtmlTags(input: string): string {
  let out = '';
  let inTag = false;
  for (const element of input) {
    const ch = element;
    if (ch === '<') {
      inTag = true;
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) out += ch;
  }
  return out;
}

function collapseWhitespace(input: string): string {
  let out = '';
  let inWs = false;
  for (const element of input) {
    const ch = element;
    if (isWhitespace(ch)) {
      if (!inWs) out += ' ';
      inWs = true;
      continue;
    }
    inWs = false;
    out += ch;
  }
  return out;
}

function removeCssDeclarations(input: string): string {
  const parts = input.split(';');
  const kept = parts.filter(part => !part.includes(':'));
  return kept.join(';');
}

function removeRgbAndColorsAndUnits(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === '#' && i + 3 < input.length) {
      let j = i + 1;
      while (j < input.length && j - (i + 1) < 6) {
        const c = input[j];
        const isHex =
          (c >= '0' && c <= '9') ||
          (c >= 'a' && c <= 'f') ||
          (c >= 'A' && c <= 'F');
        if (!isHex) break;
        j++;
      }
      const hexLen = j - (i + 1);
      if (hexLen >= 3) {
        i = j;
        continue;
      }
    }

    if (ch === 'r' && input.slice(i, i + 4) === 'rgb(') {
      const close = input.indexOf(')', i + 4);
      if (close !== -1) {
        i = close + 1;
        continue;
      }
    }

    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < input.length && input[j] >= '0' && input[j] <= '9') j++;
      const unit2 = input.slice(j, j + 2);
      const unit3 = input.slice(j, j + 3);
      if (unit2 === 'px' || unit2 === 'em') {
        i = j + 2;
        continue;
      }
      if (unit3 === 'rem') {
        i = j + 3;
        continue;
      }
      if (input[j] === '%') {
        i = j + 1;
        continue;
      }
    }

    out += ch;
    i++;
  }
  return out;
}

export function cleanRichTextContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let cleaned = stripHtmlTags(content)
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .trim();
  cleaned = collapseWhitespace(cleaned).trim();

  cleaned = removeCssDeclarations(cleaned);
  cleaned = removeRgbAndColorsAndUnits(cleaned);
  cleaned = collapseWhitespace(cleaned).trim();

  return cleaned;
}

export const isTruthyValue = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== '';

