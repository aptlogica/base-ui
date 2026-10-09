// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import {
  currencyOptions,
  currencyLocaleOptions,
  dateFormatOptions,
  timeFormatOptions,
} from '../../types/constants';

const labelClassName = 'block text-sm font-medium text-[var(--color-text-tertiary)] mb-1';

// Prevent duplicate React keys in dropdown options when constants contain repeated values.
export const getUniqueDropdownOptions = (options: Array<{ label?: string; value?: string }>) => {
  const seen = new Set<string>();
  return options.reduce<Array<{ label: string; value: string }>>((acc, option) => {
    const label = option?.label ?? option?.value ?? '';
    const value = option?.value ?? option?.label ?? '';
    if (!label || !value) return acc;
    if (seen.has(value)) return acc;
    seen.add(value);
    acc.push({ label, value });
    return acc;
  }, []);
};

const uniqueCurrencyLocaleOptions = getUniqueDropdownOptions(currencyLocaleOptions);
const uniqueCurrencyOptions = getUniqueDropdownOptions(currencyOptions);

export const currencySymbolByType: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
};

export function DateFormatSelect({
  value,
  onChange,
  label = 'Date Format',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="mb-3">
      <div className={labelClassName}>{label}</div>
      <AdvancedDropdown
        options={dateFormatOptions}
        value={value}
        onChange={(val) => onChange(val as string)}
      />
    </div>
  );
}

export function TimeFormatSelect({
  value,
  onChange,
  label = 'Time Format',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="mb-3">
      <div className={labelClassName}>{label}</div>
      <AdvancedDropdown
        options={timeFormatOptions}
        value={value}
        onChange={(val) => onChange(val as string)}
      />
    </div>
  );
}

export function CurrencySelect({
  currencyLocale,
  onCurrencyLocaleChange,
  currencyType,
  onCurrencyTypeChange,
}: {
  currencyLocale: string;
  onCurrencyLocaleChange: (value: string) => void;
  currencyType: string;
  onCurrencyTypeChange: (value: string) => void;
}) {
  return (
    <>
      <div className='flex gap-2 mb-2'>
        <div className='flex-1'>
          <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Locale</div>
          <AdvancedDropdown
            options={uniqueCurrencyLocaleOptions}
            value={currencyLocale}
            onChange={(val) => onCurrencyLocaleChange(val as string)}
            placeholder="Select Locale"
            searchable={true}
          />
        </div>
        <div className='flex-1'>
          <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Code</div>
          <AdvancedDropdown
            options={uniqueCurrencyOptions}
            value={currencyType}
            onChange={(val) => onCurrencyTypeChange(val as string)}
            placeholder="Select Currency"
            searchable={true}
          />
        </div>
      </div>
      <div className="mb-4 text-xs text-gray-600">
        Selected currency : {currencySymbolByType[currencyType] || currencyType}
      </div>
    </>
  );
}
