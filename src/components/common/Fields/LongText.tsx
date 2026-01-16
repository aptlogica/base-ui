import React, { useEffect, useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";

interface LongTextProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  readOnly?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    richText?: boolean;
    [key: string]: any;
  };
}

const DEFAULT_MAX_LENGTH = 1000;
const DEFAULT_ROWS = 4;

export const LongText: React.FC<LongTextProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength = DEFAULT_MAX_LENGTH,
  minRows = DEFAULT_ROWS,
  maxRows,
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  config = {}
}) => {
  const effectiveMaxLength = config.maxLength ?? maxLength ?? DEFAULT_MAX_LENGTH;
  const effectivePlaceholder = config.placeholder ?? placeholder ?? "";
  const defaultValue = config.defaultValue ?? "";
  const richText = config.richText ?? false;

  const initialValue = useMemo(() => {
    const incoming = value ?? "";
    if (incoming !== null && incoming !== undefined && incoming !== "") {
      return incoming;
    }
    return defaultValue || "";
  }, [value, defaultValue]);

  const [localValue, setLocalValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(allowEdit !== false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const incoming = value ?? "";
    const fallback = incoming || defaultValue || "";
    if (!isEditing || incoming !== localValue) {
      setLocalValue(fallback);
    }
  }, [value, defaultValue]);

  const validate = (val: string) => {
    const text = val ?? "";
    if (required && !text.trim()) {
      return "This field is required";
    }
    if (effectiveMaxLength && text.length > effectiveMaxLength) {
      return `Max ${effectiveMaxLength} characters`;
    }
    return null;
  };

  const commitValue = () => {
    const validationError = validate(localValue);
    setError(validationError);
    if (!validationError) {
      onChange(localValue);
    }
  };

  const handleBlur = () => {
    commitValue();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setLocalValue(initialValue);
      setError(null);
      return;
    }

    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      commitValue();
    }
  };

  const handleSingleClick = () => {
    if (disabled || readOnly) return;
    if (allowEdit !== false) {
      setIsEditing(true);
    }
  };

  const handleDoubleClick = () => {
    if (disabled || readOnly) return;
    setIsEditing(true);
  };

  const renderTextarea = (areaValue: string, onChangeHandler: (val: string) => void) => (
    <textarea
      value={areaValue}
      onChange={(e) => onChangeHandler(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      maxLength={effectiveMaxLength}
      rows={minRows}
      style={maxRows ? { maxHeight: `${maxRows * 24}px` } : undefined}
      placeholder={effectivePlaceholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`w-full field-component ${isBorder ? "field-component-border" : ""} ${disabled ? "cursor-not-allowed" : ""} ${className}`}
      aria-label={label || "Long text"}
    />
  );

  const body = isEditing ? (
    <div onClick={handleSingleClick} onDoubleClick={handleDoubleClick} className="long-text">
      {richText && (
        <div className="flex gap-2 mb-2" aria-label="Rich text toolbar">
          <button type="button" aria-label="Bold" className="px-2 py-1 rounded border">Bold</button>
          <button type="button" aria-label="Emphasis" className="px-2 py-1 rounded border">Emphasis</button>
          <button type="button" aria-label="Highlight" className="px-2 py-1 rounded border">Highlight</button>
          <button type="button" aria-label="Link" className="px-2 py-1 rounded border">Link</button>
        </div>
      )}
      {renderTextarea(localValue, (val) => setLocalValue(val))}
    </div>
  ) : (
    <div
      className={`long-text-display ${isBorder ? "field-component-border" : ""} ${className}`}
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
    >
      {localValue || effectivePlaceholder}
    </div>
  );

  return (
    <div className="w-full">
      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      <div className="relative flex items-start gap-2">
        <div className="flex-1">{body}</div>
        {!readOnly && (
          <button
            type="button"
            aria-label="Expand editor"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="mx-2 w-8 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && allowEdit && (
        <div className="mt-1.5 text-red-500 cursor-default">{error}</div>
      )}

      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-3xl">
            <div className="flex items-center mb-3">
              <span className="text-lg font-medium">Long Text Editor</span>
              <button
                type="button"
                className="ml-auto text-sm text-gray-600"
                aria-label="Close editor"
                onClick={() => {
                  commitValue();
                  setIsModalOpen(false);
                }}
              >
                Save & Close
              </button>
            </div>
            {renderTextarea(localValue, (val) => setLocalValue(val))}
          </div>
        </div>
      )}
    </div>
  );
};
