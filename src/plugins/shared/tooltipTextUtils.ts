// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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

const isHexChar = (ch: string) =>
  (ch >= '0' && ch <= '9') ||
  (ch >= 'a' && ch <= 'f') ||
  (ch >= 'A' && ch <= 'F');

const isDigit = (ch: string) => ch >= '0' && ch <= '9';

const skipHexColor = (input: string, start: number): number | null => {
  if (input[start] !== '#' || start + 3 >= input.length) return null;
  let j = start + 1;
  while (j < input.length && j - (start + 1) < 6) {
    const c = input[j];
    if (!isHexChar(c)) break;
    j++;
  }
  const hexLen = j - (start + 1);
  return hexLen >= 3 ? j : null;
};

const skipRgbFunction = (input: string, start: number): number | null => {
  if (input[start] !== 'r' || input.slice(start, start + 4) !== 'rgb(') return null;
  const close = input.indexOf(')', start + 4);
  return close === -1 ? null : close + 1;
};

const skipNumberWithUnit = (input: string, start: number): number | null => {
  if (!isDigit(input[start])) return null;
  let j = start;
  while (j < input.length && isDigit(input[j])) j++;
  const unit2 = input.slice(j, j + 2);
  const unit3 = input.slice(j, j + 3);
  if (unit2 === 'px' || unit2 === 'em') return j + 2;
  if (unit3 === 'rem') return j + 3;
  if (input[j] === '%') return j + 1;
  return null;
};

function removeRgbAndColorsAndUnits(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const nextHex = skipHexColor(input, i);
    if (nextHex !== null) {
      i = nextHex;
      continue;
    }

    const nextRgb = skipRgbFunction(input, i);
    if (nextRgb !== null) {
      i = nextRgb;
      continue;
    }

    const nextUnit = skipNumberWithUnit(input, i);
    if (nextUnit !== null) {
      i = nextUnit;
      continue;
    }

    out += input[i];
    i += 1;
  }
  return out;
}

const decodeHtmlEntities = (input: string): string =>
  input
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&');

export function cleanRichTextContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let cleaned = decodeHtmlEntities(stripHtmlTags(content)).trim();
  cleaned = collapseWhitespace(cleaned).trim();

  cleaned = removeCssDeclarations(cleaned);
  cleaned = removeRgbAndColorsAndUnits(cleaned);
  cleaned = collapseWhitespace(cleaned).trim();

  return cleaned;
}

export const isTruthyValue = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== '';
