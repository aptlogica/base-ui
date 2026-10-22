// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { IdGeneration } from '../../../types/uuid.types';
import { UUID_READ_ONLY_MESSAGE, checkUuid, idGenerationFromMeta } from '../../../utils/uuid';

interface UUIDFieldProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  // Column meta/config; its idGeneration decides between auto (read-only) and manual
  config?: { idGeneration?: IdGeneration; [key: string]: any };
  readOnly?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  allowEdit?: boolean; // true = single click to edit, false = double click
  placeholder?: string;
}

const MONO_TEXT = 'font-mono text-xs truncate';

export const UUIDField: React.FC<UUIDFieldProps> = ({
  value,
  onChange,
  config,
  readOnly = false,
  disabled = false,
  isBorder = false,
  allowEdit = true,
  placeholder = 'Paste or type a UUID',
}) => {
  const settings = idGenerationFromMeta(config);
  const isAuto = settings.mode === 'auto';
  const current = value ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [showReadOnlyTip, setShowReadOnlyTip] = useState(false);
  const [copied, setCopied] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEditing) setDraft(current);
  }, [current, isEditing]);

  useEffect(() => () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
  }, []);

  const borderClass = isBorder ? 'field-component-border' : '';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };

  if (isAuto) {
    // Auto fields: the backend creates the value; typing or pasting only explains why nothing happens
    const flashReadOnlyTip = () => {
      setShowReadOnlyTip(true);
      if (tipTimer.current) clearTimeout(tipTimer.current);
      tipTimer.current = setTimeout(() => setShowReadOnlyTip(false), 2500);
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        e.preventDefault();
        flashReadOnlyTip();
      }
    };
    return (
      <div className="w-full relative">
        <div
          className={`field-component gap-2 cursor-default ${borderClass}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPaste={e => { e.preventDefault(); flashReadOnlyTip(); }}
          title={current || undefined}
        >
          {current ? (
            <span className={`${MONO_TEXT} flex-1 min-w-0 text-[var(--text-color-secondary)]`}>{current}</span>
          ) : (
            <span className="flex-1 min-w-0 text-xs italic text-[var(--color-text-placeholder)] truncate">Generated on save</span>
          )}
          {current && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy UUID"
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-alpha-white)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        {showReadOnlyTip && (
          <div
            role="status"
            className="absolute left-2 top-full mt-1 z-20 w-max max-w-[280px] px-2.5 py-2 rounded-lg bg-[var(--color-gray-900)] text-[var(--color-alpha-white)] text-xs shadow-lg"
          >
            {UUID_READ_ONLY_MESSAGE}
          </div>
        )}
      </div>
    );
  }

  // Manual fields: any valid UUID, checked when the input loses focus
  const canEdit = !readOnly && !disabled;

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      setError(null);
      setIsEditing(false);
      if (current !== '') onChange(null);
      return;
    }
    const result = checkUuid(trimmed);
    if (!result.ok) {
      if (!isBorder) {
        // Grid cell: hand the value to the grid, which refuses it with an error toast and a red cell outline
        // (as for a duplicate unique key) and shows the saved value again
        setError(null);
        setIsEditing(false);
        setDraft(current);
        onChange(trimmed);
        return;
      }
      // Form field: keep it open with the message until the value is fixed or cleared
      setError(result.message);
      return;
    }
    setError(null);
    setIsEditing(false);
    setDraft(result.value);
    if (result.value !== current) onChange(result.value);
  };

  const cancel = () => {
    setDraft(current);
    setError(null);
    setIsEditing(false);
  };

  const startEditing = () => {
    if (canEdit) setIsEditing(true);
  };

  // Like SingleLineText: a bordered field (forms) draws its own focus and error border; in the grid the
  // cell's outline is the only border, and the grid turns it red for an invalid value
  const inputStateClass = isBorder
    ? `field-component-focus ${error ? 'border border-[var(--color-error-500)] bg-red-50' : ''}`
    : '';

  return (
    <div className="w-full relative">
      {isEditing ? (
        <input
          type="text"
          value={draft}
          autoFocus
          aria-invalid={error ? true : undefined}
          placeholder={placeholder}
          onChange={e => { setDraft(e.target.value); if (error) setError(null); }}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className={`field-component font-mono ${inputStateClass}`}
        />
      ) : (
        <div
          className={`field-component ${borderClass} ${canEdit ? '' : 'cursor-not-allowed'}`}
          role={canEdit ? 'button' : undefined}
          tabIndex={canEdit ? 0 : -1}
          aria-label={canEdit ? 'Edit UUID' : undefined}
          onClick={allowEdit ? startEditing : undefined}
          onDoubleClick={allowEdit ? undefined : startEditing}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); startEditing(); } }}
          title={current || placeholder}
        >
          <span className={`${MONO_TEXT} w-full min-w-0 ${current ? 'text-[var(--text-color-primary)]' : 'text-[var(--color-text-placeholder)] font-sans'}`}>
            {current || (canEdit ? placeholder : '')}
          </span>
          {current && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy UUID"
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-alpha-white)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="absolute left-0 top-full mt-1 z-20 flex items-center gap-1.5 w-max px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
};

export default UUIDField;
