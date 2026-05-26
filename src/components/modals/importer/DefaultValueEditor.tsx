// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import { FieldType } from '../../../types/fieldTypes';

type Props = {
  fieldType: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const inputBase =
  "field-component field-component-border field-component-focus !h-10 !rounded-xl disabled:opacity-60 disabled:cursor-not-allowed";

export const DefaultValueEditor: React.FC<Props> = ({ fieldType, value, disabled = false, onChange }) => {
  const normalizedType = String(fieldType || '').trim();

  const isNumberLike = useMemo(() => {
    return new Set<string>([
      FieldType.Number,
      FieldType.Decimal,
      FieldType.Currency,
      FieldType.Percent,
      FieldType.Year,
      FieldType.Duration,
      FieldType.Rating,
    ]).has(normalizedType as any);
  }, [normalizedType]);

  if (normalizedType === FieldType.Boolean) {
    const checked = value === 'true' || value === '1' || value.toLowerCase() === 'yes';
    return (
      <label className="inline-flex items-center gap-2 text-xs text-secondary select-none">
        <input
          type="checkbox"
          className="checkbox-primary-brand"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        <span>Default: {checked ? 'true' : 'false'}</span>
      </label>
    );
  }

  if (normalizedType === FieldType.Date) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        disabled={disabled}
      />
    );
  }

  if (normalizedType === FieldType.DateTime) {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        disabled={disabled}
      />
    );
  }

  if (normalizedType === FieldType.Time) {
    return (
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        disabled={disabled}
      />
    );
  }

  if (isNumberLike) {
    const step = normalizedType === FieldType.Decimal || normalizedType === FieldType.Currency || normalizedType === FieldType.Percent ? '0.01' : '1';
    return (
      <input
        type="number"
        value={value}
        step={step}
        min={normalizedType === FieldType.Rating ? '0' : undefined}
        max={normalizedType === FieldType.Rating ? '5' : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={normalizedType === FieldType.Rating ? '0-5' : '0'}
        className={inputBase}
        disabled={disabled}
      />
    );
  }

  // Easy/default: plain string default.
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="default value"
      className={inputBase}
      disabled={disabled}
    />
  );
};
