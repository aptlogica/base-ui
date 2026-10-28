// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// UUID field settings, kept in column meta under "idGeneration".
// Auto: the backend creates the value for every new record and the field is read-only.
// Manual: people type or paste any valid UUID.
export type UuidMode = 'auto' | 'manual';
export type UuidVersion = 'v7' | 'v4' | 'v1';

export interface IdGeneration {
  mode: UuidMode;
  version?: UuidVersion;
}

export const UUID_DEFAULT_VERSION: UuidVersion = 'v7';

// Labels exactly as in the version dropdown
export const UUID_VERSION_OPTIONS: { value: UuidVersion; label: string }[] = [
  { value: 'v7', label: 'v7 · Time-ordered (default)' },
  { value: 'v4', label: 'v4 · Random' },
  { value: 'v1', label: 'v1 · Timestamp' },
];

export const UUID_VERSION_HINTS: Record<UuidVersion, string> = {
  v7: 'Sorts by creation time. Good for primary keys and sorting.',
  v4: 'Fully random. Doesn’t reveal when a record was created.',
  v1: 'Time-based. Use only if another system needs v1.',
};

export const UUID_MODE_HINTS: Record<UuidMode, string> = {
  auto: 'A UUID is created for every new record. It can’t be edited.',
  manual: 'People type or paste any valid UUID. Nothing is generated.',
};

export const DEFAULT_ID_GENERATION: IdGeneration = { mode: 'auto', version: UUID_DEFAULT_VERSION };

// An existing uuid column without settings behaves as manual, same as the backend
export const MANUAL_ID_GENERATION: IdGeneration = { mode: 'manual' };
