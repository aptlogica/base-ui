// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';

export type CsvImportMode = 'single' | 'multiple';

interface CsvModeRadioProps {
  value: CsvImportMode;
  onChange: (mode: CsvImportMode) => void;
}

/** The header of the CSV import dialog: the same for Single and Multiple, so it does not change when the radio does */
export const CSV_IMPORT_TITLE = 'Import CSV';
export const CSV_IMPORT_SUBTITLE = 'Import one CSV file, or a .zip of several CSV files.';

/** One size for the CSV dialog in both modes (and for its first step), so switching the radio does not resize it */
export const CSV_DIALOG_SIZE = 'w-[32rem] max-w-[94vw] min-h-[620px] max-h-[94vh]';

const OPTIONS: { id: CsvImportMode; label: string }[] = [
  { id: 'single', label: 'Single CSV file' },
  { id: 'multiple', label: 'Multiple CSV files' },
];

/** The radio on top of the CSV import dialog: one .csv (creates a table) or a .zip of .csv files (creates a base) */
export const CsvModeRadio: React.FC<CsvModeRadioProps> = ({ value, onChange }) => (
  <div role="radiogroup" aria-label="CSV import type" className="flex flex-wrap gap-1.5">
    {OPTIONS.map((o) => {
      const selected = value === o.id;
      return (
        <label
          key={o.id}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium cursor-pointer select-none ${selected ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-(--color-border-primary) bg-card text-foreground hover:bg-(--color-hover-bg)'}`}
        >
          <input
            type="radio"
            name="csv-import-mode"
            value={o.id}
            checked={selected}
            onChange={() => onChange(o.id)}
            className="h-3.5 w-3.5"
          />
          {o.label}
        </label>
      );
    })}
  </div>
);
