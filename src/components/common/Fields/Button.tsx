import React from 'react';

interface ButtonConfig {
  buttonText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning';
  action?: string;
  defaultValue?: string;
  [key: string]: any;
}

interface ButtonProps {
  value?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
  config?: ButtonConfig;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  value,
  onChange,
  onClick,
  config = {},
  disabled = false
}) => {
  const { buttonText = 'Click', buttonStyle = 'primary', action, defaultValue } = config;
  
  // Initialize with value, then defaultValue, then buttonText
  const getInitialValue = () => {
    if (value && value?.trim()) {
      return value;
    }
    if (defaultValue && defaultValue?.trim()) {
      return defaultValue;
    }
    return buttonText;
  };

  const displayText = getInitialValue();

  const getButtonStyle = () => {
    switch (buttonStyle) {
      case 'secondary':
        return 'bg-[var(--color-bg-secondary-solid)] text-[var(--color-text-white)] hover:bg-[var(--color-utility-gray-700)]';
      case 'outline':
        return 'bg-transparent border border-[var(--color-border-brand)] text-[var(--color-text-brand-tertiary)] hover:bg-[var(--color-bg-brand-primary)]';
      case 'danger':
        return 'bg-[var(--color-bg-error-solid)] text-[var(--color-text-white)] hover:bg-[var(--color-error-700)]';
      case 'success':
        return 'bg-[var(--color-bg-success-solid)] text-[var(--color-text-white)] hover:bg-[var(--color-utility-success-700)]';
      case 'warning':
        return 'bg-[var(--color-bg-warning-solid)] text-[var(--color-text-white)] hover:bg-[var(--color-utility-warning-700)]';
      case 'primary':
      default:
        return 'bg-[var(--color-bg-brand-solid)] text-[var(--color-text-white)] hover:bg-[var(--color-bg-brand-solid_hover)]';
    }
  };

  const handleClick = () => {
    if (onClick) onClick();
    if (onChange) onChange(displayText);
  };

  return (
    <button
      type="button"
      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${getButtonStyle()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {displayText}
    </button>
  );
}; 