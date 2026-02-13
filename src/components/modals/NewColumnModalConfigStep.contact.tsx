import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Email, URLField, MultiLineText } from '../../components/common/Fields';

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
            <div className="flex items-center gap-2 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={phoneValid}
                  onChange={e => setPhoneValid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Accept only valid phone numbers</span>
            </div>
            <div>
              <button
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                onClick={() => setShowPhoneDefault(v => !v)}
              >
                <Plus className="w-4 h-4" />
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

          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
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
                    className="absolute right-2 top-0.5 text-gray-400 hover:text-gray-600 text-sm"
                    onClick={() => setDescription('')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    case 'email':
      return (
        <>
          <div className="flex items-center gap-2 mb-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailValid}
                onChange={e => setEmailValid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
            </label>
            <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Email validation</span>
          </div>

          <div className="mb-0">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
              onClick={() => setShowEmailDefault(v => !v)}
            >
              <Plus className="w-4 h-4" />
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

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
              onClick={() => setShowDescription(v => !v)}
            >
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <textarea
                  className="w-full px-3 py-2 description text-sm focus:outline-none min-h-[60px]"
                  placeholder="Enter field description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                {description && (
                  <button
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setDescription('')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    case 'url':
      return (
        <>
          <div className="flex items-center gap-2 mb-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={urlValid}
                onChange={e => setUrlValid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
            </label>
            <span className="text-sm font-medium text-[var(--color-text-tertiary)]">URL validation</span>
          </div>

          <div className="mb-4">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
              onClick={() => setShowUrlDefault(v => !v)}
            >
              <Plus className="w-4 h-4" />
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

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2"
              onClick={() => setShowDescription(v => !v)}
            >
              <Plus className="w-4 h-4" />
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
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setDescription('')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    default:
      return null;
  }
}
