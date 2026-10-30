// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { Info, Lock } from 'lucide-react';
import { renderDescriptionToggle } from './NewColumnModalConfigStep';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import {
  IdGeneration,
  UUID_DEFAULT_VERSION,
  UUID_MODE_HINTS,
  UUID_VERSION_HINTS,
  UUID_VERSION_OPTIONS,
  UuidMode,
  UuidVersion,
} from '../../types/uuid.types';
import { sampleUuid } from '../../utils/uuid';

const MODE_OPTIONS: { value: UuidMode; label: string }[] = [
  { value: 'auto', label: 'Auto-generated' },
  { value: 'manual', label: 'Manual' },
];

// Settings of a UUID field: who fills the value in, and which version the system generates
export function renderUuidConfigStep(props: any) {
  const {
    selectedType,
    idGeneration,
    setIdGeneration,
    isTurningUuidToAuto,
    uuidCounts,
    uuidBackfill,
    setUuidBackfill,
    isPrimaryKeyField,
    showDescription,
    setShowDescription,
    description,
    setDescription,
  } = props;

  if (selectedType?.key !== 'uuid') return null;

  const settings: IdGeneration = idGeneration ?? { mode: 'auto', version: UUID_DEFAULT_VERSION };
  const isAuto = settings.mode === 'auto';
  const version: UuidVersion = settings.version ?? UUID_DEFAULT_VERSION;
  const emptyCount: number | undefined = uuidCounts?.empty;
  const filledCount: number | undefined = uuidCounts?.filled;

  const setMode = (mode: UuidMode) =>
    setIdGeneration(mode === 'auto' ? { mode, version } : { mode });

  return (
    <>
      <div className="flex flex-col mb-4 gap-y-1.5">
        <div className="text-sm font-medium text-(--text-color-secondary)">Value</div>
        <SegmentedControl
          ariaLabel="How the value is set"
          options={MODE_OPTIONS}
          value={settings.mode}
          onChange={setMode}
        />
        <div className="text-xs text-(--text-color-tertiary)">{UUID_MODE_HINTS[settings.mode]}</div>
      </div>

      {isAuto && (
        <div className="flex flex-col mb-4 gap-y-1.5">
          <div className="text-xs font-medium text-(--text-color-secondary)">UUID version</div>
          <AdvancedDropdown
            options={UUID_VERSION_OPTIONS}
            value={version}
            onChange={(val) => setIdGeneration({ mode: 'auto', version: val as UuidVersion })}
            searchable={false}
          />
          <div className="text-xs text-(--text-color-tertiary)">{UUID_VERSION_HINTS[version]}</div>
        </div>
      )}

      {/* Only an auto field has a value to preview; a manual field is typed in */}
      {isAuto && (
        <div className="flex flex-col mb-4 gap-y-1.5">
          <div className="text-xs font-medium text-(--text-color-secondary)">Preview</div>
          <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-(--color-border-primary) bg-(--color-gray-50)">
            <Lock className="w-3.5 h-3.5 shrink-0 text-(--color-gray-500)" aria-hidden="true" />
            <span className="font-mono text-xs truncate text-(--text-color-secondary)">{sampleUuid(version)}</span>
          </div>
        </div>
      )}

      {isTurningUuidToAuto && (
        <div className="flex flex-col mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 gap-y-2">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
            <Info className="w-4 h-4" aria-hidden="true" />
            What changes when you save
          </div>
          <ul className="flex flex-col pl-6 gap-y-1 text-xs text-(--text-color-secondary)">
            <li>New records get a {version} UUID automatically.</li>
            <li>The field becomes read-only in the grid, forms and API.</li>
            <li>
              {filledCount === undefined
                ? 'Values already filled in stay as they are.'
                : `The ${filledCount.toLocaleString()} values already filled in stay as they are.`}
            </li>
          </ul>
          <div className="flex items-start gap-2 pl-6">
            <input
              id="uuidBackfill"
              type="checkbox"
              className="checkbox-primary-brand mt-0.5"
              checked={uuidBackfill || isPrimaryKeyField}
              disabled={isPrimaryKeyField}
              onChange={e => setUuidBackfill(e.target.checked)}
            />
            <label htmlFor="uuidBackfill" className="text-xs font-medium text-(--text-color-primary)">
              {emptyCount === undefined
                ? 'Fill the empty records with new UUIDs'
                : `Fill the ${emptyCount.toLocaleString()} empty records with new UUIDs`}
            </label>
          </div>
          {isPrimaryKeyField && (
            <div className="pl-12 text-xs text-amber-800">
              Required: this field is the primary key, so every record needs a value.
            </div>
          )}
        </div>
      )}

      {renderDescriptionToggle({
        showDescription,
        setShowDescription,
        description,
        setDescription,
        buttonClassName: 'flex flex-col items-center gap-2 text-primary-brand text-sm font-medium hover:text-(--color-brand-800) mb-3 gap-y-2',
        wrapperClassName: 'relative',
      })}
    </>
  );
}
