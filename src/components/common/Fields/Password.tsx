import React from 'react';

interface PasswordProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  helperText?: string;
}

const Password: React.FC<PasswordProps> = ({ value, onChange, required, disabled, isBorder, placeholder, label, helperText }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}
      <input
        type="password"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        // autoFocus
        placeholder={placeholder}
        disabled={disabled}
        className={`field-component field-component-border ${isBorder && 'field-component-focus'} ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
      />

      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default Password; 