// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef } from 'react';
import { FormConfig } from '../../../../types/form';
import { useAddImage } from '../../../../hooks/useApi';
import { useToast } from '../../../../components/common/Toast';
import { Upload, Link2, ImageUp, Trash2 } from 'lucide-react';

type Appearance = NonNullable<FormConfig['appearance']>;
type ImageKind = 'logo' | 'banner';
type FieldLayoutOption = 'single' | 'multi' | 'left';

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

const extractImageUrl = (response: any): string => {
  if (response?.data?.data?.url) return response.data.data.url;
  if (response?.data?.url) return response.data.url;
  if (response?.data?.data?.[0]?.url) return response.data.data[0].url;
  if (response?.data?.[0]?.url) return response.data[0].url;
  if (typeof response?.data === 'string') return response.data;
  if (response?.data?.data?.[0]) return response.data.data[0];
  return '';
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

const ToggleRow: React.FC<ToggleRowProps> = ({ id, label, checked, onChange }) => (
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

const ColorBarInput: React.FC<ColorBarInputProps> = ({ id, label, value, onChange }) => (
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

// Mini wireframe used inside the field-layout cards
const LayoutPreview: React.FC<{ layout: FieldLayoutOption }> = ({ layout }) => {
  const label = 'h-[0.1875rem] rounded-full bg-[var(--color-bg-brand-primary)]';
  const input = 'h-2 rounded-sm border border-[var(--color-gray-300)] bg-white';
  const rows = [0, 1, 2];

  if (layout === 'left') {
    return (
      <div className="flex flex-col gap-2 w-full">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`${label} w-4`} />
            <div className={`${input} flex-1`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {rows.map((i) => (
        <div key={i} className={layout === 'multi' ? 'grid grid-cols-2 gap-1.5' : ''}>
          {(layout === 'multi' ? [0, 1] : [0]).map((j) => (
            <div key={j} className="flex flex-col gap-1">
              <div className={`${label} w-1/2`} />
              <div className={input} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const fieldLayoutOptions: { value: FieldLayoutOption; label: string }[] = [
  { value: 'single', label: 'Single-Column' },
  { value: 'multi', label: 'Multi-Column' },
  { value: 'left', label: 'Left-Aligned Labels' },
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

const SegmentedControl = <T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) => (
  <div>
    <span className={`${labelClass} mb-2`}>{label}</span>
    <div role="group" aria-label={label} className="flex p-1 gap-1 rounded-lg bg-[var(--color-gray-100)]">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex-1 h-8 rounded-md text-sm transition-colors ${isActive
              ? 'bg-[var(--color-bg-brand-primary)] font-semibold text-[var(--color-gray-900)] shadow-xs'
              : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)]'
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

type LogoPosition = NonNullable<Appearance['logoPosition']>;

// Mini wireframe used inside the logo-position cards
const LogoPositionPreview: React.FC<{ position: LogoPosition }> = ({ position }) => (
  <div className="w-full rounded-lg border border-[var(--color-gray-200)] bg-white overflow-hidden">
    <div className="relative h-6 bg-[var(--color-gray-100)]">
      {position === 'banner' && (
        <div className="absolute left-3 -bottom-1.5 w-3 h-3 rounded-sm bg-[var(--color-bg-brand-primary)]" />
      )}
    </div>
    <div className="flex flex-col gap-1 px-3 pt-3 pb-2">
      {position === 'below' && <div className="w-3 h-3 mb-1 rounded-sm bg-[var(--color-bg-brand-primary)]" />}
      <div className="h-[0.1875rem] w-1/3 rounded-full bg-[var(--color-gray-200)]" />
      <div className="h-2 rounded-sm border border-[var(--color-gray-200)]" />
      <div className="h-[0.1875rem] w-1/3 rounded-full bg-[var(--color-gray-200)]" />
      <div className="h-2 rounded-sm border border-[var(--color-gray-200)]" />
    </div>
  </div>
);

const logoPositionOptions: { value: LogoPosition; label: string }[] = [
  { value: 'banner', label: 'On Banner' },
  { value: 'below', label: 'Below Banner' },
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

const ImageSettingField: React.FC<ImageSettingFieldProps> = ({ kind, label, url, onUrlChange }) => {
  const [error, setError] = React.useState<string | null>(null);
  // Show the URL input only for a persisted URL that didn't come from a file upload
  const [showUrlInput, setShowUrlInput] = React.useState<boolean>(() => !!url && !isFileUploadUrl(url));
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [fromBrowse, setFromBrowse] = React.useState<boolean>(() => !!url && isFileUploadUrl(url));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const addImageMutation = useAddImage();
  const toast = useToast();

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { title: 'Invalid File Type' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB', { title: 'File Too Large' });
      return;
    }

    setFromBrowse(true);
    setShowUrlInput(false);
    setUploading(true);

    try {
      const response: any = await addImageMutation.mutateAsync({ files: [file] });
      const imageUrl = extractImageUrl(response);

      if (!imageUrl) {
        toast.error('Failed to get image URL from response', { title: 'Upload Failed' });
        return;
      }

      onUrlChange(imageUrl);
      toast.success(`${label} uploaded successfully!`, { title: 'Success' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload image. Please try again.', { title: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  };

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
      {!(hasPreview && !showUrlInput) && (
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
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
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
            src={String(url)}
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

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  appearance = {},
  onChange
}) => {
  const ap: Appearance = appearance ?? {};
  const update = (patch: Partial<Appearance>) => onChange({ ...ap, ...patch });
  const activeLayout = getFieldLayoutOption(ap);

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

      <div>
        <span className={`${labelClass} mb-2`}>Field Layout</span>
        <div className="grid grid-cols-3 gap-2">
          {fieldLayoutOptions.map((option) => {
            const isActive = activeLayout === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => update(fieldLayoutToAppearance[option.value])}
                className={`flex flex-col items-center gap-2 p-2 pb-3 rounded-xl border transition-colors ${isActive
                  ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)]/5'
                  : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                  }`}
              >
                <div className="w-full flex items-center justify-center px-2 py-3 rounded-lg border border-[var(--color-gray-200)] bg-white">
                  <LayoutPreview layout={option.value} />
                </div>
                <span className="text-sm text-center leading-tight text-[var(--color-gray-700)]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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

      <div>
        <span className={`${labelClass} mb-2`}>Logo Position</span>
        <div className="grid grid-cols-2 gap-2">
          {logoPositionOptions.map((option) => {
            const isActive = (ap.logoPosition || 'banner') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => update({ logoPosition: option.value })}
                className={`flex flex-col items-center gap-2 p-2 pb-3 rounded-xl border transition-colors ${isActive
                  ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)]/5'
                  : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                  }`}
              >
                <LogoPositionPreview position={option.value} />
                <span className="text-sm text-center leading-tight text-[var(--color-gray-700)]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SegmentedControl
        label="Layout Width"
        options={layoutWidthOptions}
        value={ap.layoutWidth || 'medium'}
        onChange={(layoutWidth) => update({ layoutWidth })}
      />

      <SegmentedControl
        label="Title Alignment"
        options={alignOptions}
        value={ap.align || 'left'}
        onChange={(align) => update({ align })}
      />

      <SegmentedControl
        label="Card Style"
        options={cardStyleOptions}
        value={ap.cardStyle || 'flat'}
        onChange={(cardStyle) => update({ cardStyle })}
      />

      <SegmentedControl
        label="Rounded Corners"
        options={roundedOptions}
        value={ap.rounded || 'lg'}
        onChange={(rounded) => update({ rounded })}
      />
    </div>
  );
};
