// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { MAX, NIL, v1, v4, v7, validate } from 'uuid';
import {
  IdGeneration,
  MANUAL_ID_GENERATION,
  UUID_DEFAULT_VERSION,
  UUID_VERSION_OPTIONS,
  UuidVersion,
} from '../types/uuid.types';

export const UUID_INVALID_MESSAGE = 'Not a valid UUID.';
export const UUID_READ_ONLY_MESSAGE = 'Generated automatically. This field is read-only.';
export const UUID_CONFIG_INVALID_MESSAGE = 'Invalid UUID settings.';

// Backend response codes for uuid fields and the text the UI shows for them
export const UUID_ERROR_MESSAGES: Record<string, string> = {
  UID_1001: UUID_INVALID_MESSAGE,
  UID_1002: UUID_READ_ONLY_MESSAGE,
  UID_1003: UUID_CONFIG_INVALID_MESSAGE,
};

// checkUuid returns the value in canonical form (lowercase 8-4-4-4-12), or the message to show.
// Any version is accepted, like the backend; braces and a urn:uuid: prefix are allowed, nil and max are not.
export function checkUuid(raw: string): { ok: true; value: string } | { ok: false; message: string } {
  let candidate = (raw ?? '').trim().toLowerCase();
  if (candidate.startsWith('urn:uuid:')) candidate = candidate.slice('urn:uuid:'.length);
  if (candidate.startsWith('{') && candidate.endsWith('}')) candidate = candidate.slice(1, -1);
  if (!validate(candidate) || candidate === NIL || candidate === MAX) {
    return { ok: false, message: UUID_INVALID_MESSAGE };
  }
  return { ok: true, value: candidate };
}

const isUuidVersion = (value: unknown): value is UuidVersion =>
  UUID_VERSION_OPTIONS.some(option => option.value === value);

// Column meta may arrive as an object or a JSON string
const parseMeta = (meta: unknown): Record<string, any> => {
  if (meta && typeof meta === 'object') return meta as Record<string, any>;
  if (typeof meta === 'string' && meta.trim()) {
    try {
      const parsed = JSON.parse(meta);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

// The uuid settings of a column's meta; a column without settings is manual
export function idGenerationFromMeta(meta: unknown): IdGeneration {
  const raw = parseMeta(meta).idGeneration;
  if (raw?.mode === 'auto') {
    return { mode: 'auto', version: isUuidVersion(raw.version) ? raw.version : UUID_DEFAULT_VERSION };
  }
  return MANUAL_ID_GENERATION;
}

export interface UuidColumnRef {
  uidt?: string;
  type?: string;
  meta?: unknown;
  config?: unknown;
}

// True for a uuid column whose values the backend generates; those can't be typed in, imported or edited
export function isAutoUuidColumn(column: UuidColumnRef | null | undefined): boolean {
  if (!column) return false;
  const uidt = String(column.uidt ?? column.type ?? '').toLowerCase();
  if (uidt !== 'uuid') return false;
  return idGenerationFromMeta(column.config ?? column.meta).mode === 'auto';
}

// Why a value can't be saved in a manual uuid column, or null when it can (other columns, empty values,
// valid UUIDs). The grid checks this before saving, like a primary key, and shows it as an error toast.
export function uuidCellProblem(column: UuidColumnRef | null | undefined, value: unknown): string | null {
  if (!column || String(column.uidt ?? column.type ?? '').toLowerCase() !== 'uuid' || isAutoUuidColumn(column)) {
    return null;
  }
  if (value === null || value === undefined) return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text.trim() === '') return null;
  const result = checkUuid(text);
  return result.ok ? null : result.message;
}

// A sample value of the chosen version, for the settings preview
export function sampleUuid(version: UuidVersion): string {
  switch (version) {
    case 'v4':
      return v4();
    case 'v1':
      return v1();
    default:
      return v7();
  }
}

// "Auto · v7" / "Manual" for the column header badge
export function uuidModeLabel(settings: IdGeneration): string {
  return settings.mode === 'auto' ? `Auto · ${settings.version ?? UUID_DEFAULT_VERSION}` : 'Manual';
}
