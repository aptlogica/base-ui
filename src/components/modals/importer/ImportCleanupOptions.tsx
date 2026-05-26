// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';

export type ImportCleanupOptionsState = {
  removeDuplicateRecords: boolean;
  trimExtraSpaces: boolean;
  removeEmptyRows: boolean;
};

type Props = {
  value: ImportCleanupOptionsState;
  onChange: (next: ImportCleanupOptionsState) => void;
};

const ToggleRow: React.FC<{
  checked: boolean;
  label: string;
  onToggle: () => void;
}> = ({ checked, label, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-left py-1.5"
    >
      <input type="checkbox" checked={checked} readOnly className="checkbox-primary-brand" />
      <span className="text-sm text-primary">{label}</span>
    </button>
  );
};

export const ImportCleanupOptions: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="pb-4 border-b">
      <div className="text-sm font-semibold text-primary">Clean & Map Data</div>
      <div className="text-xs text-secondary mt-1 mb-4">
        Apply cleaning rules and map incoming columns to structured fields for accurate import.
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ToggleRow
          checked={value.removeDuplicateRecords}
          label="Remove duplicate records"
          onToggle={() => onChange({ ...value, removeDuplicateRecords: !value.removeDuplicateRecords })}
        />
        <ToggleRow
          checked={value.trimExtraSpaces}
          label="Trim extra spaces"
          onToggle={() => onChange({ ...value, trimExtraSpaces: !value.trimExtraSpaces })}
        />
        <ToggleRow
          checked={value.removeEmptyRows}
          label="Remove empty rows"
          onToggle={() => onChange({ ...value, removeEmptyRows: !value.removeEmptyRows })}
        />
      </div>
    </div>
  );
};
