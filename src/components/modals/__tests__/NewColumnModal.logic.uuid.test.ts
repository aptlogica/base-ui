import { describe, expect, it } from 'vitest';
import { buildColumnPayload, buildFieldMeta, type BuildFieldMetaParams } from '../NewColumnModal.logic';

// Only the fields the uuid branch reads matter; the rest keep their neutral values
const uuidParams = (overrides: Partial<BuildFieldMetaParams> = {}): BuildFieldMetaParams => ({
  selectedTypeKey: 'uuid',
  defaultValue: '',
  richText: false,
  showThousands: false,
  precision: '1.0',
  checkboxIcon: 'check',
  checkboxColor: 'green',
  checkboxDefault: false,
  selectOptions: [],
  singleDefault: '',
  multiDefault: [],
  ratingIcon: 'star',
  ratingColor: 'yellow',
  ratingMax: 5,
  ratingDefault: 0,
  description: '',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'hh:mm',
  hourFormat: '24',
  displayTimeZone: false,
  sameTimezone: false,
  timeZone: '',
  timeZoneOptions: [],
  dateTimeDefault: '',
  currencyType: 'USD',
  currencyLocale: 'en-US',
  displayAsProgress: false,
  progressColor: 'blue',
  percentDefault: null,
  durationFormat: 'h:mm',
  durationDefault: 0,
  yearDefault: null,
  dateDefault: '',
  timeDefault: '',
  phoneValid: false,
  phoneDefault: '',
  emailValid: false,
  emailDefault: '',
  urlValid: false,
  urlDefault: '',
  allowMultipleUsers: false,
  selectedUsers: null,
  selectedTableId: '',
  selectedTable: null,
  relationType: 'one-to-one',
  selectedRelationId: '',
  selectedLookupColumnId: '',
  linkFields: [],
  buttonStyle: 'primary',
  buttonAction: 'url',
  openButtonInNewTab: true,
  formulaText: '',
  formulaFormatting: { type: 'text', precision: 2, currency: 'USD', dateFormat: 'YYYY-MM-DD' },
  getBrowserTimeZone: () => 'UTC',
  ...overrides,
});

describe('buildFieldMeta for UUID fields', () => {
  it('saves an auto field with v7 by default', () => {
    expect(buildFieldMeta(uuidParams({ idGeneration: { mode: 'auto' } })).meta).toEqual({
      idGeneration: { mode: 'auto', version: 'v7' },
    });
  });

  it.each(['v4', 'v1'] as const)('saves an auto field with %s', (version) => {
    expect(buildFieldMeta(uuidParams({ idGeneration: { mode: 'auto', version } })).meta).toEqual({
      idGeneration: { mode: 'auto', version },
    });
  });

  it('saves a manual field without a version', () => {
    expect(buildFieldMeta(uuidParams({ idGeneration: { mode: 'manual' } })).meta).toEqual({
      idGeneration: { mode: 'manual' },
    });
  });

  it('never saves a default value', () => {
    const { meta } = buildFieldMeta(uuidParams({ defaultValue: 'left over', idGeneration: { mode: 'auto', version: 'v4' } }));
    expect(meta).not.toHaveProperty('defaultValue');
  });

  it('treats missing settings as manual', () => {
    expect(buildFieldMeta(uuidParams()).meta).toEqual({ idGeneration: { mode: 'manual' } });
  });
});

describe('buildColumnPayload backfill', () => {
  const base = { fieldName: 'Order Ref', selectedTypeKey: 'uuid', description: '', fields: [], meta: {} };

  it('sends backfill when given', () => {
    expect(buildColumnPayload({ ...base, backfill: true })).toMatchObject({ backfill: true });
    expect(buildColumnPayload({ ...base, backfill: false })).toMatchObject({ backfill: false });
  });

  it('leaves backfill out otherwise', () => {
    expect(buildColumnPayload(base)).not.toHaveProperty('backfill');
  });
});
