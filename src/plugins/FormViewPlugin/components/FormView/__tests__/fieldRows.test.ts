// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import { buildFieldRows, moveFieldOnDrop } from '../fieldRows';
import { FormField } from '../../../../../types/form';

const field = (id: string): FormField => ({ id, name: id, type: 'text', label: id });
const fields = ['a', 'b', 'c', 'd'].map(field);
const ids = (list: FormField[]) => list.map(f => f.id);
const rowIds = (rows: FormField[][]) => rows.map(ids);

describe('buildFieldRows', () => {
  it('puts every field on its own row by default', () => {
    expect(rowIds(buildFieldRows(fields))).toEqual([['a'], ['b'], ['c'], ['d']]);
  });

  it('joins inline fields to the previous row, two per row at most', () => {
    expect(rowIds(buildFieldRows(fields, ['b', 'c']))).toEqual([['a', 'b'], ['c'], ['d']]);
    expect(rowIds(buildFieldRows(fields, ['b', 'd']))).toEqual([['a', 'b'], ['c', 'd']]);
  });
});

describe('moveFieldOnDrop', () => {
  it('places the dragged field to the right of the target in the same row', () => {
    const result = moveFieldOnDrop(fields, fields, [], 'd', 'a', 'right');
    expect(ids(result!.fields)).toEqual(['a', 'd', 'b', 'c']);
    expect(result!.inlineFieldIds).toEqual(['d']);
  });

  it('places the dragged field to the left of the target in the same row', () => {
    const result = moveFieldOnDrop(fields, fields, [], 'a', 'c', 'left');
    expect(ids(result!.fields)).toEqual(['b', 'a', 'c', 'd']);
    expect(result!.inlineFieldIds).toEqual(['c']);
  });

  it('swaps the dragged field into a full row on a side drop', () => {
    const result = moveFieldOnDrop(fields, fields, ['b'], 'd', 'a', 'right');
    expect(ids(result!.fields)).toEqual(['d', 'b', 'c', 'a']);
    expect(result!.inlineFieldIds).toEqual(['b']);
  });

  it('swaps fields between the columns of two full rows', () => {
    const result = moveFieldOnDrop(fields, fields, ['b', 'd'], 'a', 'd', 'left');
    expect(ids(result!.fields)).toEqual(['d', 'b', 'c', 'a']);
    expect(result!.inlineFieldIds).toEqual(['b', 'a']);
  });

  it('swaps sides within the same row', () => {
    const result = moveFieldOnDrop(fields, fields, ['b'], 'a', 'b', 'right');
    expect(ids(result!.fields)).toEqual(['b', 'a', 'c', 'd']);
    expect(result!.inlineFieldIds).toEqual(['a']);
  });

  it('moves the field to its own row on a center drop and leaves its partner alone', () => {
    const result = moveFieldOnDrop(fields, fields, ['b'], 'b', 'd', 'center');
    expect(ids(result!.fields)).toEqual(['a', 'c', 'd', 'b']);
    expect(result!.inlineFieldIds).toEqual([]);
  });

  it('keeps a center drop from splitting the target row', () => {
    const result = moveFieldOnDrop(fields, fields, ['d'], 'a', 'd', 'center');
    expect(ids(result!.fields)).toEqual(['b', 'c', 'd', 'a']);
    expect(result!.inlineFieldIds).toEqual(['d']);
  });

  it('ignores hidden fields when grouping rows', () => {
    const visible = fields.filter(f => f.id !== 'b');
    const result = moveFieldOnDrop(fields, visible, [], 'd', 'c', 'left');
    expect(ids(result!.fields)).toEqual(['a', 'b', 'd', 'c']);
    expect(result!.inlineFieldIds).toEqual(['c']);
  });

  it('returns null when dropped on itself', () => {
    expect(moveFieldOnDrop(fields, fields, [], 'a', 'a', 'left')).toBeNull();
  });
});
