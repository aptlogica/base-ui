import React from 'react';

interface ButtonProps {
  value?: any;
  onChange?: (value: any) => void;
  config?: any;
  disabled?: boolean;
  readOnly?: boolean;
  [key: string]: any;
}

/**
 * Button field component stub
 * Displays button text or label from config
 */
export const Button: React.FC<ButtonProps> = ({ value, config, disabled, readOnly, ...props }) => {
  const buttonText = value || config?.buttonText || config?.label || 'Button';
  const buttonUrl = config?.buttonUrl || config?.url || '';
  const openInNewTab = config?.openInNewTab || false;

  if (disabled || readOnly) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        {buttonText}
      </div>
    );
  }

  if (buttonUrl) {
    return (
      <a
        href={buttonUrl}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-brand bg-primary-brand/10 hover:bg-primary-brand/20 rounded-md transition-colors"
        {...props}
      >
        {buttonText}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-brand bg-primary-brand/10 hover:bg-primary-brand/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled || readOnly}
      {...props}
    >
      {buttonText}
    </button>
  );
};
