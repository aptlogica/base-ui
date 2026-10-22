import { describe, expect, it } from 'vitest';
import { version } from 'uuid';
import {
  UUID_INVALID_MESSAGE,
  checkUuid,
  idGenerationFromMeta,
  isAutoUuidColumn,
  sampleUuid,
  uuidCellProblem,
  uuidModeLabel,
} from '../uuid';
import { apiErrorMessage } from '../apiErrors';
import { requiredKeyColumnIds } from '../primaryKeyFields';

describe('checkUuid', () => {
  it.each([
    ['v1', 'c232ab00-9414-11ec-b3c8-9f6bdeced846'],
    ['v4', '3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63'],
    ['v7', '019a0c4e-8f21-7b3d-a9c4-5e2f1d8b6a70'],
    ['v8', '320c3d4d-cc00-875b-8ec9-32d5f69181c0'],
  ])('accepts a %s UUID', (_, value) => {
    expect(checkUuid(value)).toEqual({ ok: true, value });
  });

  it('normalises braces, urn prefix, case and spaces', () => {
    expect(checkUuid(' {3F6C2A9E-1B47-4D8A-9E05-7C2B4F1A8D63} ')).toEqual({
      ok: true,
      value: '3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63',
    });
    expect(checkUuid('urn:uuid:3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63')).toEqual({
      ok: true,
      value: '3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63',
    });
  });

  it.each([
    'ORD-2291-A',
    '3f6c2a9e-1b47-4d8a-9e05',
    '',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ])('rejects %j', (value) => {
    expect(checkUuid(value)).toEqual({ ok: false, message: UUID_INVALID_MESSAGE });
  });
});

describe('idGenerationFromMeta', () => {
  it('reads auto settings with their version', () => {
    expect(idGenerationFromMeta({ idGeneration: { mode: 'auto', version: 'v4' } })).toEqual({ mode: 'auto', version: 'v4' });
  });

  it('defaults an auto field without a known version to v7', () => {
    expect(idGenerationFromMeta({ idGeneration: { mode: 'auto' } })).toEqual({ mode: 'auto', version: 'v7' });
    expect(idGenerationFromMeta({ idGeneration: { mode: 'auto', version: 'v5' } })).toEqual({ mode: 'auto', version: 'v7' });
  });

  it('treats a field without settings as manual, including meta given as a JSON string', () => {
    expect(idGenerationFromMeta({})).toEqual({ mode: 'manual' });
    expect(idGenerationFromMeta(undefined)).toEqual({ mode: 'manual' });
    expect(idGenerationFromMeta('{"idGeneration":{"mode":"auto","version":"v1"}}')).toEqual({ mode: 'auto', version: 'v1' });
    expect(idGenerationFromMeta('not json')).toEqual({ mode: 'manual' });
  });
});

describe('isAutoUuidColumn', () => {
  it('is true only for uuid columns in auto mode', () => {
    expect(isAutoUuidColumn({ uidt: 'uuid', meta: { idGeneration: { mode: 'auto' } } })).toBe(true);
    expect(isAutoUuidColumn({ uidt: 'uuid', config: { idGeneration: { mode: 'auto' } } })).toBe(true);
    expect(isAutoUuidColumn({ uidt: 'uuid', meta: { idGeneration: { mode: 'manual' } } })).toBe(false);
    expect(isAutoUuidColumn({ uidt: 'uuid' })).toBe(false);
    expect(isAutoUuidColumn({ uidt: 'text', meta: { idGeneration: { mode: 'auto' } } })).toBe(false);
    expect(isAutoUuidColumn(undefined)).toBe(false);
  });
});

describe('sampleUuid and uuidModeLabel', () => {
  it('creates a sample of the chosen version', () => {
    expect(version(sampleUuid('v7'))).toBe(7);
    expect(version(sampleUuid('v4'))).toBe(4);
    expect(version(sampleUuid('v1'))).toBe(1);
  });

  it('labels the header badge', () => {
    expect(uuidModeLabel({ mode: 'auto', version: 'v4' })).toBe('Auto · v4');
    expect(uuidModeLabel({ mode: 'auto' })).toBe('Auto · v7');
    expect(uuidModeLabel({ mode: 'manual' })).toBe('Manual');
  });
});

describe('UUID error codes', () => {
  it('maps backend UID codes to the UI wording', () => {
    expect(apiErrorMessage({ code: 'UID_1001', message: 'not a valid UUID' }, 'x')).toBe(UUID_INVALID_MESSAGE);
    expect(apiErrorMessage({ code: 'UID_1002', message: 'read only' }, 'x')).toBe('Generated automatically. This field is read-only.');
    expect(apiErrorMessage({ code: 'UID_1003', message: 'bad' }, 'x')).toBe('Invalid UUID settings.');
  });
});

describe('required key fields with an auto UUID', () => {
  it('does not ask for an auto-generated UUID key field', () => {
    const columns = [
      { id: 'c1', column_name: 'order_ref', uidt: 'uuid', meta: { idGeneration: { mode: 'auto', version: 'v7' } } },
      { id: 'c2', column_name: 'external_id', uidt: 'uuid', meta: { idGeneration: { mode: 'manual' } } },
    ];
    expect(requiredKeyColumnIds(['c1', 'c2'], columns)).toEqual(['c2']);
  });
});

describe('uuidCellProblem', () => {
  const manual = { uidt: 'uuid', meta: { idGeneration: { mode: 'manual' } } };

  it('refuses an invalid value in a manual uuid column', () => {
    expect(uuidCellProblem(manual, 'dd')).toBe(UUID_INVALID_MESSAGE);
    expect(uuidCellProblem({ type: 'uuid' }, '00000000-0000-0000-0000-000000000000')).toBe(UUID_INVALID_MESSAGE);
  });

  it('lets valid and empty values through', () => {
    expect(uuidCellProblem(manual, '3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63')).toBeNull();
    expect(uuidCellProblem(manual, '')).toBeNull();
    expect(uuidCellProblem(manual, null)).toBeNull();
  });

  it('ignores other columns and auto uuid columns', () => {
    expect(uuidCellProblem({ uidt: 'text' }, 'dd')).toBeNull();
    expect(uuidCellProblem({ uidt: 'uuid', meta: { idGeneration: { mode: 'auto', version: 'v7' } } }, 'dd')).toBeNull();
    expect(uuidCellProblem(undefined, 'dd')).toBeNull();
  });
});
