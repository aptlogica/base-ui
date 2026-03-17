// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { cleanRichTextContent, isTruthyValue } from './tooltipTextUtils';
import { utcISOToZoned } from '../../utils/dateUtils';

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

const convertFromISO = (isoDate: string, toFormat: string): string => {
  const [year, month, day] = isoDate.split('-');
  switch (toFormat) {
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD MM YYYY':
      return `${day} ${month} ${year}`;
    case 'YYYY-MM-DD':
    default:
      return isoDate;
  }
};

const formatTimeWithFormat = (time: string, timeFormat: string | undefined) => {
  if (!time) return '';
  const parts = time.split(':');
  const hour = Number(parts[0]);
  const minute = parts.length > 1 ? Number(parts[1]) : 0;
  const second = parts.length > 2 ? Number(parts[2]) : undefined;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const includeSeconds = timeFormat?.includes('ss') ?? false;
  const use12Hour = timeFormat?.includes('hh') ?? false;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  let baseHour = hour;
  if (use12Hour) {
    baseHour = (hour % 12) || 12;
  }
  let suffix = '';
  if (use12Hour) {
    suffix = hour >= 12 ? ' PM' : ' AM';
  }
  const secPart = includeSeconds ? `:${pad2(second ?? 0)}` : '';
  return `${pad2(baseHour)}:${pad2(minute)}${secPart}${suffix}`.trim();
};

const getTimeZone = (col: TooltipColumn): string =>
  col?.meta?.timeZoneLabel ||
  col?.meta?.timeZone ||
  Intl.DateTimeFormat().resolvedOptions().timeZone;

const getDateTimeParts = (rawStr: string, timeZone: string | undefined) => {
  let datePart: string | undefined;
  let timePart: string | undefined;

  if (timeZone && rawStr.includes('T')) {
    try {
      const utcIso = rawStr.endsWith('Z') ? rawStr : `${rawStr}Z`;
      const zonedDateTime = utcISOToZoned(utcIso, timeZone);
      const [zonedDate, zonedTime = '00:00'] = zonedDateTime.split(' ');
      datePart = zonedDate;
      timePart = zonedTime;
    } catch {
      // fall through to raw parsing
    }
  }

  if (!datePart) {
    const [rawDate, timePartRaw] = rawStr.split('T');
    datePart = rawDate;
    timePart = timePartRaw ? timePartRaw.replace('Z', '').split('.')[0] : '';
  }

  return { datePart, timePart };
};

const formatDateOnly = (rawStr: string, dateFormat: string) => {
  const isoDate = rawStr.includes('T') ? rawStr.split('T')[0] : rawStr;
  return convertFromISO(isoDate, dateFormat);
};

const formatDateTime = (rawStr: string, col: TooltipColumn, dateFormat: string, timeFormat: string) => {
  const timeZone = getTimeZone(col);
  const { datePart, timePart } = getDateTimeParts(rawStr, timeZone);
  if (!datePart) return undefined;
  const formattedDate = convertFromISO(datePart, dateFormat);
  if (!timePart) return formattedDate;
  return `${formattedDate} ${formatTimeWithFormat(timePart, timeFormat)}`;
};

const formatDateLike = (type: string, raw: any, col: TooltipColumn) => {
  if (!raw) return undefined;
  const rawStr = String(raw);
  const dateFormat = col?.meta?.dateFormat || 'YYYY-MM-DD';
  const timeFormat = col?.meta?.timeFormat || 'HH:mm';

  if (type === 'date') {
    return formatDateOnly(rawStr, dateFormat);
  }

  if (type === 'datetime' || type === 'createdtime' || type === 'lastmodifiedtime') {
    return formatDateTime(rawStr, col, dateFormat, timeFormat);
  }

  return undefined;
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
        format: () => formatDateLike(type, raw, col),
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
