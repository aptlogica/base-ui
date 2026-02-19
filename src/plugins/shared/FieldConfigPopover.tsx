import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers } from 'lucide-react';
import { AdvancedDropdown } from '../../components/common/dropdown/AdvancedDropdown';
import { useSmartPopover } from '../../hooks/useSmartPopover';

interface FieldConfigOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface FieldConfigPopoverProps {
  buttonLabel: string;
  title: string;
  dropdownLabel: string;
  options: FieldConfigOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  helpText?: string;
  required?: boolean;
  validate?: (value: string | string[] | undefined) => string | undefined;
  className?: string;
}

export const FieldConfigPopover: React.FC<FieldConfigPopoverProps> = ({
  buttonLabel,
  title,
  dropdownLabel,
  options,
  value,
  onChange,
  placeholder,
  helpText,
  required,
  validate,
  className = ''
}) => {
  return (
    <FieldConfigPopoverShell buttonLabel={buttonLabel} title={title} className={className}>
      <div className="space-y-4">
        <div>
          <AdvancedDropdown
            label={dropdownLabel}
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            searchable={true}
            required={required}
            helpText={helpText}
            validate={validate}
            className="w-full"
          />
        </div>
      </div>
    </FieldConfigPopoverShell>
  );
};

interface FieldConfigPopoverShellProps {
  buttonLabel: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}

export const FieldConfigPopoverShell: React.FC<FieldConfigPopoverShellProps> = ({
  buttonLabel,
  title,
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const { position } = useSmartPopover({
    open: isOpen,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => setIsOpen(false)
  });

  // Close on Escape
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-brand-primary)] text-black hover:bg-[var(--color-bg-brand-primary)] hover:text-black font-semibold rounded-xl transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Layers className="w-4 h-4" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && position && createPortal(
        <div
          ref={panelRef}
          className="p-4 bg-card border rounded-xl shadow-lg z-50 min-w-[320px] max-w-[400px]"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};
