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
  if (targets.some(target => type === target)) return true;
  if (!matchUidt) return false;
  const uidtLower = uidt.toLowerCase();
  return targets.some(target => uidtLower === target.toLowerCase());
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

  try {
    if (type === 'longtext' && col?.uidt === 'longText' && typeof raw === 'string' && raw.includes('<')) {
      const cleaned = cleanRichTextContent(raw);
      return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
    }

    if (matchesType(type, uidt, ['currency'], matchUidt)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
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
      }
      return '-';
    }
    if (matchesType(type, uidt, ['percent'], matchUidt)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) return `${num}%`;
      return '-';
    }
    if (matchesType(type, uidt, ['email'], matchUidt)) {
      return String(raw);
    }
    if (matchesType(type, uidt, ['phone', 'phonenumber'], matchUidt)) {
      return String(raw);
    }
    if (matchesType(type, uidt, ['url'], matchUidt)) {
      return String(raw);
    }
    if (matchesType(type, uidt, ['number'], matchUidt)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toLocaleString('en-US');
      return '-';
    }
    if (matchesType(type, uidt, ['decimal'], matchUidt)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) return num.toFixed(2);
      return '-';
    }
    if (matchesType(type, uidt, ['rating'], matchUidt)) {
      return String(raw);
    }
    if (matchesType(type, uidt, ['boolean', 'checkbox'], matchUidt) && booleanAsYesNo) {
      return raw ? 'Yes' : 'No';
    }
    if (type === 'date' || type === 'datetime' || type === 'createdtime' || type === 'lastmodifiedtime') {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        if (type === 'date') {
          return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } else {
          return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
    }
    if (type === 'time') {
      const s = String(raw);
      if (/^\d{1,2}:\d{2}$/.test(s)) return formatTime(s);
      return s;
    }
    if (type === 'multiselect') {
      if (Array.isArray(raw)) return raw.map(v => String(v?.label ?? v)).join(', ');
      try { const parsed = JSON.parse(String(raw)); if (Array.isArray(parsed)) return parsed.join(', '); } catch { }
    }
    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === 'object' && raw[0].title) {
        return raw.map((v: any) => v?.title || v?.name || String(v)).join(', ');
      }
      return raw.map(v => (v?.name || v?.filename || v?.fileName || String(v))).join(', ');
    }
    if (typeof raw === 'object') {
      const name = raw?.name || raw?.label || raw?.title;
      if (name) return String(name);
      return '-';
    }

    const str = String(raw);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  } catch {
    return '-';
  }
}
