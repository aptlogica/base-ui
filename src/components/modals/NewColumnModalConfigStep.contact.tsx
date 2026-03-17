// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { Plus, Trash2 } from 'lucide-react';
import { Email, URLField, MultiLineText } from '../../components/common/Fields';

const renderValidationToggle = (checked: boolean, onChange: (checked: boolean) => void, label: string) => (
  <div className="flex items-center gap-2 mb-3">
    <label className="relative inline-flex gap-3 items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
      <div className="absolute left-0.5 top-1 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
      <span className="text-sm font-medium text-[var(--color-text-tertiary)]">{label}</span>
    </label>
  </div>
);

const renderDescriptionSection = (
  showDescription: boolean,
  setShowDescription: (next: (v: boolean) => boolean) => void,
  description: string,
  setDescription: (value: string) => void,
  buttonClassName: string,
  trashButtonClassName: string
) => (
  <div className="relative">
    <button
      className={buttonClassName}
      onClick={() => setShowDescription((v: boolean) => !v)}
    >
      <Plus className="w-5 h-5" />
      Add description
    </button>
    {showDescription && (
      <>
        <MultiLineText
          placeholder="Enter field description..."
          value={description}
          onChange={value => setDescription(value)}
          rows={4}
          isBorder={true}
        />
        {description && (
          <button
            className={trashButtonClassName}
            onClick={() => setDescription('')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </>
    )}
  </div>
);

export function renderContactConfigStep(props: any) {
  const {
    selectedType,
    phoneValid,
    setPhoneValid,
    showPhoneDefault,
    setShowPhoneDefault,
    phoneDefault,
    setPhoneDefault,
    showDescription,
    setShowDescription,
    description,
    setDescription,
    emailValid,
    setEmailValid,
    showEmailDefault,
    setShowEmailDefault,
    emailDefault,
    setEmailDefault,
    urlValid,
    setUrlValid,
    showUrlDefault,
    setShowUrlDefault,
    urlDefault,
    setUrlDefault,
  } = props;

  const handleUrlChange = (value: string) => {
    setUrlDefault(value);
  };

  switch (selectedType?.key) {
    case 'phoneNumber':
      return (
        <>
          <div className="mb-3 space-y-2">
            <div className="mb-4">
              {renderValidationToggle(
                phoneValid,
                (checked) => setPhoneValid(checked),
                'Accept only valid phone numbers'
              )}
            </div>
            <div>
              <button
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                onClick={() => setShowPhoneDefault((v: boolean) => !v)}
              >
                <Plus className="w-5 h-5" />
                Set default value
              </button>
              {showPhoneDefault && (
                <input
                  className="field-component field-component-border field-component-focus"
                  placeholder="Enter default phone number"
                  value={phoneDefault}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^\d{0,12}$/.test(value)) {
                      setPhoneDefault(value);
                    }
                  }}
                />
              )}
            </div>
          </div>

          {renderDescriptionSection(
            showDescription,
            setShowDescription,
            description,
            setDescription,
            'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
            'absolute right-2 top-0.5 text-gray-400 hover:text-red-500 text-sm'
          )}
        </>
      );
    case 'email':
      return (
        <>
          {renderValidationToggle(
            emailValid,
            (checked) => setEmailValid(checked),
            'Email validation'
          )}

          <div className="mb-0">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
              onClick={() => setShowEmailDefault((v: boolean) => !v)}
            >
              <Plus className="w-5 h-5" />
              Set default value
            </button>
            {showEmailDefault && (
              <Email
                value={emailDefault}
                onChange={value => setEmailDefault(value)}
                placeholder="Enter default email..."
                isBorder={true}
                config={{
                  emailValid: emailValid
                }}
              />
            )}
          </div>

          {renderDescriptionSection(
            showDescription,
            setShowDescription,
            description,
            setDescription,
            'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
            'absolute right-2 top-2 text-gray-400 hover:text-red-500'
          )}
        </>
      );
    case 'url':
      return (
        <>
          {renderValidationToggle(
            urlValid,
            (checked) => setUrlValid(checked),
            'URL validation'
          )}

          <div className="mb-4">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
              onClick={() => setShowUrlDefault((v: boolean) => !v)}
            >
              <Plus className="w-5 h-5" />
              Set default value
            </button>
            {showUrlDefault && (
              <div className="mt-2">
                <URLField
                  value={urlDefault}
                  onChange={handleUrlChange}
                  placeholder="e.g. https://example.com"
                  isBorder={true}
                  config={{
                    urlValid: urlValid
                  }}
                />
              </div>
            )}
          </div>

          {renderDescriptionSection(
            showDescription,
            setShowDescription,
            description,
            setDescription,
            'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
            'absolute right-2 top-2 text-gray-400 hover:text-red-500'
          )}
        </>
      );
    default:
      return null;
  }
}
