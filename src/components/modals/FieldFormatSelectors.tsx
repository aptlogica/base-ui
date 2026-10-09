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
  timeZoneOptions,
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

export type HourFormat = '12' | '24';

const hourOptionClassName = (selected: boolean) =>
  `flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${selected
    ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
    : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`;

export function HourFormatSelect({
  value,
  onChange,
  label = 'Time Display',
}: {
  value: HourFormat;
  onChange: (value: HourFormat) => void;
  label?: string;
}) {
  return (
    <div className="mb-3">
      <div className={labelClassName}>{label}</div>
      <div className="flex items-center gap-2">
        {(['12', '24'] as const).map((option) => (
          <label key={option} className={hourOptionClassName(value === option)}>
            <input
              type="radio"
              className="hidden"
              checked={value === option}
              onChange={() => onChange(option)}
            />{option} Hrs
          </label>
        ))}
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
      </div>
      <span className="text-sm text-[var(--color-text-tertiary)]">{label}</span>
    </label>
  );
}

const timeZoneDropdownOptions = timeZoneOptions.map((o: any) => ({ label: o.label, value: o.label, rightLabel: o.value, description: o.value }));

export function TimeZoneSettings({
  displayTimeZone,
  onDisplayTimeZoneChange,
  sameTimezone,
  onSameTimezoneChange,
  timeZone,
  onTimeZoneChange,
}: {
  displayTimeZone: boolean;
  onDisplayTimeZoneChange: (value: boolean) => void;
  sameTimezone: boolean;
  onSameTimezoneChange: (value: boolean) => void;
  timeZone: string;
  onTimeZoneChange: (value: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="space-y-2">
        <ToggleSwitch checked={displayTimeZone} onChange={onDisplayTimeZoneChange} label="Display time zone" />
        <ToggleSwitch checked={sameTimezone} onChange={onSameTimezoneChange} label="Use same timezone for all members" />
        {sameTimezone && (
          <div className="mt-2">
            <AdvancedDropdown
              options={timeZoneDropdownOptions}
              value={timeZone}
              onChange={(val: any) => onTimeZoneChange(val as string)}
              searchable={true}
              placeholder="Select time zone"
            />
          </div>
        )}
      </div>
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
