// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Calendar, Clock, Mail, User, Paperclip, Check, X } from 'lucide-react';
import { DateTime } from 'luxon';

/**
 * Base pill styling - consistent gray pills for all lookup values
 */
const BASE_PILL_CLASSES = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-background text-gray-700 border border-gray-200 whitespace-nowrap';

/**
 * Helper to strip HTML tags from text
 */
const stripHTML = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Format date string to human-readable format
 */
const formatDate = (dateString: string, sourceColumn?: any): string => {
  try {
    const meta = sourceColumn?.meta || sourceColumn?.config || {};
    const tz = meta.timeZoneLabel || meta.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isDateTimeType =
      String(sourceColumn?.uidt || sourceColumn?.type || '').toLowerCase() === 'datetime';

    // Parse ISO first (UTC-aware for Z values), fallback to SQL-like formats.
    let dt = DateTime.fromISO(dateString, { zone: 'utc' });
    if (!dt.isValid) {
      dt = DateTime.fromSQL(dateString, { zone: tz });
    }
    if (!dt.isValid) {
      return dateString;
    }

    // Date-only values should not be shifted by timezone conversion.
    const hasTimeInfo = dateString.includes('T') || dateString.includes(' ');
    if (!hasTimeInfo && !isDateTimeType) {
      return dt.toFormat('LLL d, yyyy');
    }

    const zoned = dt.setZone(tz);
    return zoned.toFormat('LLL d, yyyy, h:mm a');
  } catch {
    return dateString;
  }
};

/**
 * Format duration string (e.g., "20.566666666666666" -> "00:20:34")
 */
const formatDuration = (duration: string, format?: string): string => {
  try {
    const seconds = Number.parseFloat(duration);
    if (Number.isNaN(seconds)) return duration;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (format === 'h:mm:ss.s') {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } catch {
    return duration;
  }
};

interface RenderPillProps {
  value: any;
  sourceColumn: any;
  index: number;
  userDisplayMap?: Record<string, string>;
}

/**
 * Render rating field as numeric value only (no icons)
 */
export const renderRatingPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  const ratingValue = typeof value === 'number' ? value : Number.parseInt(String(value)) || 0;
  if (ratingValue <= 0) return null;
  
  // Just show the numeric value in a pill, no icons
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span>{ratingValue}</span>
    </span>
  );
};

/**
 * Render long text field - strip HTML and truncate
 */
export const renderLongTextPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  
  const text = stripHTML(String(value));
  const truncated = text.length > 50 ? text.substring(0, 47) + '...' : text;
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={text}>
      <span className="truncate max-w-[200px] block">{truncated}</span>
    </span>
  );
};

/**
 * Render date/datetime field with calendar icon
 */
export const renderDateTimePill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;
  
  const formatted = formatDate(String(value), sourceColumn);
  const isDateTime = String(value).includes('T') || String(value).includes(' ');
  const Icon = isDateTime ? Clock : Calendar;
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="truncate max-w-[150px] block">{formatted}</span>
    </span>
  );
};

/**
 * Render email field with mail icon
 */
export const renderEmailPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  
  const email = String(value);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={email}>
      <Mail className="w-4 h-4 text-gray-500" />
      <span className="truncate max-w-[150px] block">{email}</span>
    </span>
  );
};

/**
 * Render user/contact field with user icon
 */
export const renderUserPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;

  const displayMap = sourceColumn?.__lookupUserDisplayMap as Record<string, string> | undefined;
  const resolveDisplayName = (raw: any): string => {
    if (raw && typeof raw === 'object') {
      const objId = raw.id ? String(raw.id) : '';
      return (
        raw.name ||
        raw.display_name ||
        raw.email ||
        (objId && displayMap?.[objId]) ||
        String(raw.title || objId || raw)
      );
    }

    const text = String(raw);
    // Handle comma-separated IDs in a single lookup value.
    if (text.includes(',')) {
      return text
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((id) => displayMap?.[id] || id)
        .join(', ');
    }

    return displayMap?.[text] || text;
  };

  const displayText = resolveDisplayName(value);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={displayText}>
      <User className="w-4 h-4 text-gray-500" />
      <span className="truncate max-w-[150px] block">{displayText}</span>
    </span>
  );
};

/**
 * Render duration field with clock icon
 */
export const renderDurationPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;
  
  const meta = sourceColumn?.meta || {};
  const format = meta.durationFormat || 'h:mm:ss';
  const formatted = formatDuration(String(value), format);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <Clock className="w-4 h-4 text-gray-500" />
      <span className="truncate max-w-[120px] block">{formatted}</span>
    </span>
  );
};

/**
 * Render attachment field with paperclip icon
 */
export const renderAttachmentPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;
  
  // Handle array of attachments
  const attachments = Array.isArray(value) ? value : [value];
  const firstAttachment = attachments[0];
  
  if (!firstAttachment) return null;
  
  const fileName = firstAttachment.title || firstAttachment.name || 'attachment';
  const count = attachments.length > 1 ? ` (${attachments.length})` : '';
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={fileName}>
      <Paperclip className="w-4 h-4 text-gray-500" />
      <span className="truncate max-w-[120px] block">{fileName}{count}</span>
    </span>
  );
};

/**
 * Render checkbox/boolean field with check/X icon
 */
export const renderCheckboxPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  const boolValue = value === true || value === 'true' || value === 1;
  const Icon = boolValue ? Check : X;
  const text = boolValue ? 'True' : 'False';
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <Icon className={`w-4 h-4 ${boolValue ? 'text-green-600' : 'text-red-600'}`} />
      <span>{text}</span>
    </span>
  );
};

/**
 * Render currency field
 */
export const renderCurrencyPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined) return null;
  
  const meta = sourceColumn?.meta || sourceColumn?.config || {};
  const currencyType = meta.currencyType || 'USD';
  const currencyLocale = meta.currencyLocale || 'en-US';
  const precision = Number.isFinite(Number(meta.precision)) ? Number(meta.precision) : 2;
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
  
  if (Number.isNaN(numValue)) return null;
  
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(currencyLocale, {
      style: 'currency',
      currency: currencyType,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(numValue);
  } catch {
    formatted = `${currencyType} ${numValue.toLocaleString()}`;
  }
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span className="truncate max-w-[150px] block">{formatted}</span>
    </span>
  );
};

/**
 * Render percent field
 */
export const renderPercentPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined) return null;
  
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numValue)) return null;
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span className="truncate max-w-[100px] block">{numValue}%</span>
    </span>
  );
};

/**
 * Render decimal field
 */
export const renderDecimalPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined) return null;
  
  const meta = sourceColumn?.meta || {};
  const precision = meta.precision ? Number.parseInt(meta.precision.split('.')[1]?.length) || 2 : 2;
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
  
  if (Number.isNaN(numValue)) return null;
  
  const formatted = numValue.toFixed(precision);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span className="truncate max-w-[120px] block">{formatted}</span>
    </span>
  );
};

/**
 * Render URL field
 */
export const renderURLPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  
  const url = String(value);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={url}>
      <span className="truncate max-w-[150px] block">{url}</span>
    </span>
  );
};

/**
 * Render phone number field
 */
export const renderPhoneNumberPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  
  const phone = String(value);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={phone}>
      <span className="truncate max-w-[120px] block">{phone}</span>
    </span>
  );
};

/**
 * Render year field
 */
export const renderYearPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined) return null;
  
  const year = typeof value === 'number' ? value : Number.parseInt(String(value));
  if (Number.isNaN(year)) return null;
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span>{year}</span>
    </span>
  );
};

/**
 * Render number field
 */
export const renderNumberPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined) return null;
  
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numValue)) return null;
  
  return (
    <span key={index} className={BASE_PILL_CLASSES}>
      <span className="truncate max-w-[120px] block">{numValue.toLocaleString()}</span>
    </span>
  );
};

/**
 * Render JSON field - show truncated JSON string
 */
export const renderJSONPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;
  
  let jsonString = '';
  try {
    jsonString = JSON.stringify(value);
  } catch {
    jsonString = String(value);
  }
  
  const truncated = jsonString.length > 30 ? jsonString.substring(0, 27) + '...' : jsonString;
  
  return (
    <span key={index} className={`${BASE_PILL_CLASSES} font-mono`} title={jsonString}>
      <span className="truncate max-w-[150px] block">{truncated}</span>
    </span>
  );
};

/**
 * Get color classes for select options
 */
const getSelectColorClasses = (color: string): string => {
  if (!color) return '';
  
  // Map common color names to Tailwind classes
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-100 text-blue-700 border-blue-200',
    'green': 'bg-green-100 text-green-700 border-green-200',
    'purple': 'bg-purple-100 text-purple-700 border-purple-200',
    'orange': 'bg-orange-100 text-orange-700 border-orange-200',
    'pink': 'bg-pink-100 text-pink-700 border-pink-200',
    'indigo': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'cyan': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'red': 'bg-red-100 text-red-700 border-red-200',
    'yellow': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'teal': 'bg-teal-100 text-teal-700 border-teal-200',
  };
  
  // If it's a hex color, use inline style
  if (color.startsWith('#')) {
    return '';
  }
  
  return colorMap[color.toLowerCase()] || '';
};

/**
 * Render multiselect field - show first few options with +N badge
 */
export const renderMultiSelectPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value) return null;
  
  // Handle nested arrays for multiselect lookup
  let options: string[] = [];
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      // Nested array structure - flatten it
      value.forEach((subArray: any) => {
        if (Array.isArray(subArray)) {
          subArray.forEach((val: any) => {
            if (val !== null && val !== undefined) {
              options.push(String(val));
            }
          });
        }
      });
    } else {
      options = value
        .filter(v => v !== null && v !== undefined)
        .map(String);
    }
  }
  
  if (options.length === 0) return null;
  
  // Get option colors from source column meta
  const meta = sourceColumn?.meta || {};
  const optionConfigs = meta.options || [];
  const getOptionColor = (option: string) => {
    const config = optionConfigs.find((opt: any) => opt.option === option);
    return config?.color || '';
  };
  
  // Show first option or first few with +N
  const maxVisible = 2;
  const visibleOptions = options.slice(0, maxVisible);
  const remainingCount = options.length - maxVisible;
  
  return (
    <span key={index} className="inline-flex items-center gap-1">
      {visibleOptions.map((option) => {
        const color = getOptionColor(option);
        const colorClasses = getSelectColorClasses(color);
        const hasHexColor = color?.startsWith('#');
        
        return (
          <span
            key={option}
            className={colorClasses || BASE_PILL_CLASSES}
            style={hasHexColor ? { backgroundColor: `${color}20`, color: color, borderColor: `${color}40` } : undefined}
            title={option}
          >
            <span className="truncate max-w-[120px] block">{option}</span>
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span className={BASE_PILL_CLASSES}>
          +{remainingCount}
        </span>
      )}
    </span>
  );
};

/**
 * Render single select field
 */
export const renderSingleSelectPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  
  const option = String(value);
  const meta = sourceColumn?.meta || {};
  const optionConfigs = meta.options || [];
  const config = optionConfigs.find((opt: any) => opt.option === option);
  const color = config?.color || '';
  const colorClasses = getSelectColorClasses(color);
  const hasHexColor = color?.startsWith('#');
  
  return (
    <span 
      key={index} 
      className={colorClasses || BASE_PILL_CLASSES}
      style={hasHexColor ? { backgroundColor: `${color}20`, color: color, borderColor: `${color}40` } : undefined}
      title={option}
    >
      <span className="truncate max-w-[120px] block">{option}</span>
    </span>
  );
};

/**
 * Render text field (default fallback)
 */
export const renderTextPill = ({ value, sourceColumn, index }: RenderPillProps): React.ReactNode => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  
  const text = String(value);
  
  return (
    <span key={index} className={BASE_PILL_CLASSES} title={text}>
      <span className="truncate max-w-[150px] block">{text}</span>
    </span>
  );
};

