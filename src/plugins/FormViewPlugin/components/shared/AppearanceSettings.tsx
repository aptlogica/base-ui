// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef } from 'react';
import { FormConfig } from '../../../../types/form';
import { useImageUpload } from './useImageUpload';
import { Upload, Link2, ImageUp, Trash2 } from 'lucide-react';

type Appearance = NonNullable<FormConfig['appearance']>;
type ImageKind = 'logo' | 'banner';
type FieldLayoutOption = 'single' | 'multi' | 'left';

interface ImageOption<T extends string> {
  value: T;
  label: string;
  image: string;
}

// Helper function to detect if URL is from file upload (localhost or assets path)
const isFileUploadUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' || urlObj.pathname.includes('/assets/');
  } catch {
    // If URL parsing fails, check if it contains assets path
    return url.includes('/assets/');
  }
};

const validateUrl = (val: string): boolean => {
  if (!val) return true;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const colorOptions = [
  '#ECFDF3', '#E0DDFB', '#FCE7F0', '#FEFCE8', '#E0F9FC',
  '#EBE9FE', '#D5EEFC', '#FEFDE6', '#D7FAEA'
];

const labelClass = 'block text-sm font-medium text-[var(--color-gray-700)]';
const outlineButtonClass =
  'h-9 px-3 flex-1 flex items-center justify-center gap-2 border border-[var(--color-gray-300)] rounded-lg text-sm font-medium text-[var(--color-gray-700)] bg-background hover:bg-gray-50 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed';

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<Readonly<ToggleRowProps>> = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="w-full relative flex items-center justify-between cursor-pointer">
    <span className={labelClass}>{label}</span>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div className={`w-7 h-4 rounded-full transition-colors ${checked ? 'bg-[var(--color-bg-brand-primary)]' : 'bg-[var(--color-gray-100)] border border-[var(--color-gray-200)]'}`}>
      <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-[0.0625rem] ${checked ? 'translate-x-[0.8125rem]' : 'translate-x-[0.0625rem]'}`} />
    </div>
  </label>
);

interface ColorBarInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorBarInput: React.FC<Readonly<ColorBarInputProps>> = ({ id, label, value, onChange }) => (
  <div>
    <label htmlFor={id} className={`${labelClass} mb-1.5`}>{label}</label>
    <div className="relative p-1 border border-[var(--color-gray-300)] rounded-lg bg-background">
      <div className="h-7 w-full rounded-md" style={{ backgroundColor: value }} />
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  </div>
);

const fieldLayoutOptions: ImageOption<FieldLayoutOption>[] = [
  { value: 'single', label: 'Single-Column', image: '/assets/form-layout-single-column.svg' },
  { value: 'multi', label: 'Multi-Column', image: '/assets/form-layout-multi-column.svg' },
  { value: 'left', label: 'Left-Aligned Labels', image: '/assets/form-layout-left-aligned-labels.svg' },
];

const getFieldLayoutOption = (ap: Appearance): FieldLayoutOption => {
  if (ap.labelPosition === 'left') return 'left';
  if (ap.fieldLayout === 'grid-2') return 'multi';
  return 'single';
};

const fieldLayoutToAppearance: Record<FieldLayoutOption, Pick<Appearance, 'fieldLayout' | 'labelPosition'>> = {
  single: { fieldLayout: 'list', labelPosition: 'top' },
  multi: { fieldLayout: 'grid-2', labelPosition: 'top' },
  left: { fieldLayout: 'list', labelPosition: 'left' },
};

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string>({ label, options, value, onChange }: Readonly<SegmentedControlProps<T>>) => (
  <fieldset className="min-w-0">
    <legend className={`${labelClass} mb-2`}>{label}</legend>
    <div className="flex w-full p-2 gap-1 rounded-lg bg-[var(--color-gray-100)]">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex-1 min-w-0 h-8 px-[0.875rem] py-[0.375rem] flex items-center justify-center rounded-md border text-sm whitespace-nowrap transition-colors ${isActive
              ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)] font-semibold text-[var(--color-gray-900)] shadow-xs'
              : 'border-transparent font-medium text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)]'
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </fieldset>
);

interface ImageOptionGridProps<T extends string> {
  label: string;
  options: ImageOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const ImageOptionGrid = <T extends string>({ label, options, value, onChange }: Readonly<ImageOptionGridProps<T>>) => (
  <div>
    <span className={`${labelClass} mb-2`}>{label}</span>
    <div className={`grid gap-2 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-2 p-2 pb-3 rounded-xl border transition-colors ${isActive
              ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)]/5'
              : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
              }`}
          >
            <img src={option.image} alt="" aria-hidden="true" className="w-full h-auto block" />
            <span className="text-sm text-center leading-tight text-[var(--color-gray-700)]">{option.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

type LogoPosition = NonNullable<Appearance['logoPosition']>;

const logoPositionOptions: ImageOption<LogoPosition>[] = [
  { value: 'banner', label: 'On Banner', image: '/assets/form-logo-on-banner.svg' },
  { value: 'below', label: 'Below Banner', image: '/assets/form-logo-below-banner.svg' },
];

const layoutWidthOptions: { value: NonNullable<Appearance['layoutWidth']>; label: string }[] = [
  { value: 'narrow', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'wide', label: 'Large' },
];

const alignOptions: { value: NonNullable<Appearance['align']>; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const cardStyleOptions: { value: NonNullable<Appearance['cardStyle']>; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'elevated', label: 'Elevated' },
];

const roundedOptions: { value: NonNullable<Appearance['rounded']>; label: string }[] = [
  { value: 'md', label: 'Small' },
  { value: 'lg', label: 'Medium' },
  { value: 'xl', label: 'Large' },
];

interface ImageSettingFieldProps {
  kind: ImageKind;
  label: string;
  url?: string;
  onUrlChange: (url: string) => void;
}

const ImageSettingField: React.FC<Readonly<ImageSettingFieldProps>> = ({ kind, label, url, onUrlChange }) => {
  const [error, setError] = React.useState<string | null>(null);
  // Show the URL input only for a persisted URL that didn't come from a file upload
  const [showUrlInput, setShowUrlInput] = React.useState<boolean>(() => !!url && !isFileUploadUrl(url));
  const [fromBrowse, setFromBrowse] = React.useState<boolean>(() => !!url && isFileUploadUrl(url));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleUploaded = React.useCallback((imageUrl: string) => {
    setFromBrowse(true);
    setShowUrlInput(false);
    onUrlChange(imageUrl);
  }, [onUrlChange]);
  const { upload, uploading } = useImageUpload(handleUploaded, `${label} uploaded successfully!`);

  React.useEffect(() => {
    if (showUrlInput) {
      urlInputRef.current?.focus();
    }
  }, [showUrlInput]);

  React.useEffect(() => {
    if (url && isFileUploadUrl(url)) {
      setShowUrlInput(false);
      setFromBrowse(true);
    }
  }, [url]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => { void upload(event.target.files?.[0]); };

  const handleRemove = () => {
    onUrlChange('');
    setShowUrlInput(false);
    setFromBrowse(false);
  };

  const inputId = `${kind}-url-label`;
  const hasPreview = !!url && !error;
  const lowerLabel = label.toLowerCase();

  return (
    <div>
      <label htmlFor={inputId} className={`${labelClass} mb-1.5`}>{label}</label>
      {(!hasPreview || showUrlInput) && (
        <div className="flex gap-2 w-full">
          {showUrlInput ? (
            <input
              id={inputId}
              type="url"
              placeholder="https://..."
              value={url || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (validateUrl(v)) {
                  setError(null);
                  onUrlChange(v);
                  setFromBrowse(false);
                } else {
                  setError('Invalid URL');
                }
              }}
              ref={urlInputRef}
              className={`flex-1 w-full field-component field-component-border field-component-focus ${error ? 'border-red-500' : ''}`}
            />
          ) : (
            <button type="button" onClick={() => setShowUrlInput(true)} className={outlineButtonClass}>
              <Link2 className="h-4 w-4" />
              <span>Insert via URL</span>
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {!showUrlInput && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={outlineButtonClass}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Browse</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hasPreview && (
        <div className="mt-2 bg-card rounded-lg p-1.5 border flex items-center gap-3">
          <img
            src={url}
            alt={`${label} preview`}
            className={kind === 'banner' ? 'h-12 w-20 object-cover rounded' : 'h-12 w-12 object-contain rounded'}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={replaceInputRef}
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {fromBrowse && (
              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                title={`Change ${lowerLabel}`}
              >
                <ImageUp className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title={`Remove ${lowerLabel}`}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AppearanceSettingsProps {
  appearance: FormConfig['appearance'];
  onChange: (appearance: FormConfig['appearance']) => void;
}

export const AppearanceSettings: React.FC<Readonly<AppearanceSettingsProps>> = ({
  appearance,
  onChange
}) => {
  const ap: Appearance = appearance ?? {};
  const update = (patch: Partial<Appearance>) => onChange({ ...ap, ...patch });

  return (
    <div className="space-y-5">
      <h4 className="text-sm font-medium text-[var(--color-gray-900)]">Appearance Settings</h4>

      <div>
        <span className={`${labelClass} mb-2`}>Background Color</span>
        <div className="flex gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Background color ${color}`}
              onClick={() => update({ backgroundColor: color })}
              className={`flex-1 aspect-square max-w-9 rounded-lg border transition-all ${ap.backgroundColor === color
                ? 'border-[var(--color-bg-brand-primary)] ring-2 ring-[var(--color-bg-brand-primary)] ring-offset-1'
                : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorBarInput
          id="primary-color-label"
          label="Primary Color"
          value={ap.primaryColor || '#2563eb'}
          onChange={(primaryColor) => update({ primaryColor })}
        />
        <ColorBarInput
          id="text-color-label"
          label="Text Color"
          value={ap.textColor || '#111827'}
          onChange={(textColor) => update({ textColor })}
        />
      </div>

      <ToggleRow
        id="hide-branding-label"
        label="Hide Branding"
        checked={!!ap.hideNocoBranding}
        onChange={(hideNocoBranding) => update({ hideNocoBranding })}
      />

      <ImageOptionGrid
        label="Field Layout"
        options={fieldLayoutOptions}
        value={getFieldLayoutOption(ap)}
        onChange={(layout) => update(fieldLayoutToAppearance[layout])}
      />

      <ToggleRow
        id="hide-banner-label"
        label="Hide Banner"
        checked={!!ap.hideBanner}
        onChange={(hideBanner) => update({ hideBanner })}
      />

      <ImageSettingField
        kind="banner"
        label="Banner"
        url={ap.bannerUrl}
        onUrlChange={(bannerUrl) => update({ bannerUrl })}
      />

      <ImageSettingField
        kind="logo"
        label="Logo"
        url={ap.logoUrl}
        onUrlChange={(logoUrl) => update({ logoUrl })}
      />

      <ImageOptionGrid
        label="Logo Position"
        options={logoPositionOptions}
        value={ap.logoPosition ?? 'banner'}
        onChange={(logoPosition) => update({ logoPosition })}
      />

      <SegmentedControl
        label="Layout Width"
        options={layoutWidthOptions}
        value={ap.layoutWidth ?? 'medium'}
        onChange={(layoutWidth) => update({ layoutWidth })}
      />

      <SegmentedControl
        label="Title Alignment"
        options={alignOptions}
        value={ap.align ?? 'left'}
        onChange={(align) => update({ align })}
      />

      <SegmentedControl
        label="Card Style"
        options={cardStyleOptions}
        value={ap.cardStyle ?? 'flat'}
        onChange={(cardStyle) => update({ cardStyle })}
      />

      <SegmentedControl
        label="Rounded Corners"
        options={roundedOptions}
        value={ap.rounded ?? 'lg'}
        onChange={(rounded) => update({ rounded })}
      />
    </div>
  );
};
