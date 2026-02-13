import { describe, expect, it } from 'vitest';
import {
  buildColumnPayload,
  buildFieldMeta,
  getUniqueColumnNameByUidt,
  isDuplicateFieldName,
  toTitleCase,
} from '../NewColumnModal.logic';

describe('NewColumnModal.logic', () => {
  it('detects duplicate field names with current field excluded', () => {
    const fields = [
      { id: '1', title: 'Status' },
      { id: '2', title: 'Priority' },
    ];

    expect(isDuplicateFieldName({ fieldName: 'status', fields })).toBe(true);
    expect(isDuplicateFieldName({ fieldName: 'status', fields, currentId: '1' })).toBe(false);
  });

  it('generates unique uidt-based field names', () => {
    const fields = [{ title: 'Text' }, { title: 'Text 2' }];
    expect(getUniqueColumnNameByUidt('text', fields)).toBe('Text 1');
  });

  it('returns validation error when links field has no target', () => {
    const result = buildFieldMeta({
      selectedTypeKey: 'links',
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
    });

    expect(result.error).toBe('Target table is required for relation fields');
  });

  it('builds datetime meta including timezone and default datetime', () => {
    const result = buildFieldMeta({
      selectedTypeKey: 'datetime',
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
      timeFormat: 'HH:mm',
      hourFormat: '24',
      displayTimeZone: true,
      sameTimezone: false,
      timeZone: '',
      timeZoneOptions: [{ label: 'UTC', value: 'utc' }],
      dateTimeDefault: '10:15',
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
    });

    expect(result.error).toBeUndefined();
    expect(result.meta.timeZone).toBe('utc');
    expect(result.meta.timeZoneLabel).toBe('UTC');
    expect(result.meta.defaultValue).toMatch(/T10:15$/);
  });

  it('builds column payload and preserves links meta on edit', () => {
    const payload = buildColumnPayload({
      fieldName: '',
      selectedTypeKey: 'links',
      description: 'desc',
      fields: [{ title: 'Links' }, { title: 'Links 2' }],
      initialValues: { meta: { relation: { with: 'abc', type: 'one-to-one' } } },
      meta: { relation: { with: 'xyz', type: 'has-many' } },
    });

    expect(payload.name).toBe('Links 1');
    expect(payload.meta).toEqual({ relation: { with: 'abc', type: 'one-to-one' } });
  });

  it('formats title case and increments names with existing numbered suffixes', () => {
    expect(toTitleCase('last_modified_time')).toBe('Last Modified Time');
    expect(getUniqueColumnNameByUidt('lastModifiedTime', [{ title: 'Last Modified Time' }, { title: 'Last Modified Time 1' }]))
      .toBe('Last Modified Time 2');
  });

  it('returns lookup-specific validation errors and relation id validation', () => {
    const baseParams = {
      selectedTypeKey: 'lookup',
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
      hourFormat: '24' as const,
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
      relationType: 'one-to-one' as const,
      selectedRelationId: '',
      selectedLookupColumnId: '',
      linkFields: [],
      buttonStyle: 'primary',
      buttonAction: 'url',
      openButtonInNewTab: true,
      formulaText: '',
      formulaFormatting: { type: 'text' as const, precision: 2, currency: 'USD', dateFormat: 'YYYY-MM-DD' },
      getBrowserTimeZone: () => 'UTC',
    };

    expect(buildFieldMeta(baseParams).error).toBe('Please select a Link Field');

    const missingLookup = buildFieldMeta({ ...baseParams, selectedRelationId: 'rel1' });
    expect(missingLookup.error).toBe('Please select a Lookup Field');

    const missingRelationId = buildFieldMeta({
      ...baseParams,
      selectedRelationId: 'rel1',
      selectedLookupColumnId: 'lookup1',
      linkFields: [{ id: 'rel1', meta: {} }],
    });
    expect(missingRelationId.error).toBe('Selected link field does not have a valid relation_id');
  });

  it('builds time, json, user, button and formula meta branches', () => {
    const common = {
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
      timeFormat: 'HH:mm',
      hourFormat: '12' as const,
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
      relationType: 'one-to-one' as const,
      selectedRelationId: '',
      selectedLookupColumnId: '',
      linkFields: [],
      buttonStyle: 'primary',
      buttonAction: 'url',
      openButtonInNewTab: true,
      formulaText: '',
      formulaFormatting: { type: 'number' as const, precision: 3, currency: 'USD', dateFormat: 'YYYY-MM-DD' },
      getBrowserTimeZone: () => 'UTC',
    };

    const timeMeta = buildFieldMeta({
      ...common,
      selectedTypeKey: 'time',
      defaultValue: '',
      timeDefault: '02:30 PM',
    });
    expect(timeMeta.meta.defaultValue).toBe('14:30');

    const jsonParsed = buildFieldMeta({
      ...common,
      selectedTypeKey: 'json',
      defaultValue: '{"a":1}',
    });
    expect(jsonParsed.meta.defaultValue).toBe('{"a":1}');

    const jsonObject = buildFieldMeta({
      ...common,
      selectedTypeKey: 'json',
      defaultValue: { a: 1 },
    });
    expect(jsonObject.meta.defaultValue).toEqual({ a: 1 });

    const jsonFallback = buildFieldMeta({
      ...common,
      selectedTypeKey: 'json',
      defaultValue: '{bad-json}',
    });
    expect(jsonFallback.meta.defaultValue).toBe('{bad-json}');

    const userMeta = buildFieldMeta({
      ...common,
      selectedTypeKey: 'user',
      defaultValue: '',
      allowMultipleUsers: true,
      selectedUsers: ['u1', 'u2'],
    });
    expect(userMeta.meta.allowMultiple).toBe(true);
    expect(userMeta.meta.defaultValue).toEqual(['u1', 'u2']);

    const buttonMeta = buildFieldMeta({
      ...common,
      selectedTypeKey: 'button',
      defaultValue: 'Open',
      buttonStyle: 'secondary',
      buttonAction: 'url',
      openButtonInNewTab: false,
    });
    expect(buttonMeta.meta).toEqual(
      expect.objectContaining({ buttonText: 'Open', buttonStyle: 'secondary', action: 'url', openInNewTab: false })
    );

    const formulaMeta = buildFieldMeta({
      ...common,
      selectedTypeKey: 'formula',
      defaultValue: '',
      formulaText: 'ADD(1,2)',
    });
    expect(formulaMeta.meta.formula).toBe('ADD(1,2)');
    expect(formulaMeta.meta.formatting.precision).toBe(3);
  });
});
