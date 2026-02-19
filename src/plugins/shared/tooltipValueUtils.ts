import { cleanRichTextContent, isTruthyValue } from './tooltipTextUtils';

type TooltipColumn = {
  type?: string;
  uidt?: string;
  meta?: any;
};

type CurrencyFallback = {
  locale: string;
  currency: string;
};

export type TooltipFormatOptions = {
  formatTime: (t: string) => string;
  matchUidt?: boolean;
  useMetaCurrency?: boolean;
  currencyFallback?: CurrencyFallback;
  booleanAsYesNo?: boolean;
};

const matchesType = (type: string, uidt: string, targets: string[], matchUidt?: boolean) => {
  if (targets.includes(type)) return true;
  if (!matchUidt) return false;
  const uidtLower = uidt.toLowerCase();
  return targets.some(target => uidtLower === target.toLowerCase());
};

const truncateText = (value: string, max: number) =>
  value.length > max ? `${value.substring(0, max)}...` : value;

const formatRichText = (raw: string) => {
  const cleaned = cleanRichTextContent(raw);
  return truncateText(cleaned, 100);
};

const formatCurrencyValue = (
  raw: any,
  col: TooltipColumn,
  useMetaCurrency?: boolean,
  currencyFallback?: CurrencyFallback
) => {
  const num = Number(raw);
  if (Number.isNaN(num)) return '-';
  if (useMetaCurrency) {
    const meta = col?.meta || {};
    const currencyType = meta.currencyType || 'USD';
    const currencyLocale = meta.currencyLocale || 'en-US';
    return new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyType }).format(num);
  }
  const fallback = currencyFallback || { locale: 'en-US', currency: 'USD' };
  return new Intl.NumberFormat(fallback.locale, {
    style: 'currency',
    currency: fallback.currency,
  }).format(num);
};

const formatNumberValue = (raw: any) => {
  const num = Number(raw);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('en-US');
};

const formatDecimalValue = (raw: any) => {
  const num = Number(raw);
  if (Number.isNaN(num)) return '-';
  return num.toFixed(2);
};

const formatDateLike = (type: string, raw: any) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  if (type === 'date') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatTimeValue = (raw: any, formatTime: (t: string) => string) => {
  const s = String(raw);
  if (/^\d{1,2}:\d{2}$/.test(s)) return formatTime(s);
  return s;
};

const formatMultiSelectValue = (raw: any) => {
  if (Array.isArray(raw)) return raw.map(v => String(v?.label ?? v)).join(', ');
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {
    // fall through
  }
  return undefined;
};

const formatArrayValue = (raw: any[]) => {
  if (raw.length > 0 && typeof raw[0] === 'object' && raw[0].title) {
    return raw.map((v: any) => v?.title || v?.name || String(v)).join(', ');
  }
  return raw.map(v => (v?.name || v?.filename || v?.fileName || String(v))).join(', ');
};

const formatObjectValue = (raw: any) => {
  const name = raw?.name || raw?.label || raw?.title;
  if (name) return String(name);
  return '-';
};

export function formatTooltipValue(
  col: TooltipColumn,
  raw: any,
  options: TooltipFormatOptions
): string | null {
  if (!isTruthyValue(raw)) return '-';

  const type = String(col?.type || col?.uidt || '').toLowerCase();
  const uidt = String(col?.uidt || '');
  const { formatTime, matchUidt, useMetaCurrency, currencyFallback, booleanAsYesNo } = options;

  const typeMatches = (targets: string[]) => matchesType(type, uidt, targets, matchUidt);
  const isDateLike = () => type === 'date' || type === 'datetime' || type === 'createdtime' || type === 'lastmodifiedtime';
  const isRichText = () =>
    type === 'longtext' && col?.uidt === 'longText' && typeof raw === 'string' && raw.includes('<');

  try {
    if (isRichText()) return formatRichText(raw);

    const rules: Array<{ when: () => boolean; format: () => string | undefined }> = [
      { when: () => typeMatches(['currency']), format: () => formatCurrencyValue(raw, col, useMetaCurrency, currencyFallback) },
      {
        when: () => typeMatches(['percent']),
        format: () => {
          const num = Number(raw);
          return Number.isNaN(num) ? '-' : `${num}%`;
        },
      },
      { when: () => typeMatches(['email', 'phone', 'phonenumber', 'url']), format: () => String(raw) },
      { when: () => typeMatches(['number']), format: () => formatNumberValue(raw) },
      { when: () => typeMatches(['decimal']), format: () => formatDecimalValue(raw) },
      { when: () => typeMatches(['rating']), format: () => String(raw) },
      { when: () => typeMatches(['boolean', 'checkbox']) && !!booleanAsYesNo, format: () => (raw ? 'Yes' : 'No') },
      {
        when: () => isDateLike(),
        format: () => formatDateLike(type, raw),
      },
      { when: () => type === 'time', format: () => formatTimeValue(raw, formatTime) },
      { when: () => type === 'multiselect', format: () => formatMultiSelectValue(raw) },
    ];

    for (const rule of rules) {
      if (rule.when()) {
        const result = rule.format();
        if (result !== undefined) return result;
      }
    }

    if (Array.isArray(raw)) return formatArrayValue(raw);
    if (typeof raw === 'object') return formatObjectValue(raw);
    return truncateText(String(raw), 50);
  } catch {
    return '-';
  }
}
