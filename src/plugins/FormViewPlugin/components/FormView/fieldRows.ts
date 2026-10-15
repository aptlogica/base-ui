// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { FormField } from '../../../../types/form';
import type { DropPosition } from './SortableFormField';

// Groups fields into rows of at most two; a field in inlineIds joins the row before it if that row has room
export const buildFieldRows = (fields: FormField[], inlineIds: string[] = []): FormField[][] => {
  const inline = new Set(inlineIds);
  const rows: FormField[][] = [];
  fields.forEach(field => {
    const lastRow = rows.at(-1);
    if (lastRow?.length === 1 && inline.has(field.id)) {
      lastRow.push(field);
    } else {
      rows.push([field]);
    }
  });
  return rows;
};

// Ids that actually share a row with the field before them
const getInlineIds = (rows: FormField[][]): string[] =>
  rows.filter(row => row.length === 2).map(row => row[1].id);

export interface FieldDropResult {
  fields: FormField[];
  inlineFieldIds: string[];
}

const getCenterInsertIndex = (
  fields: FormField[],
  remaining: FormField[],
  targetRow: FormField[],
  draggedId: string,
  targetId: string
): number => {
  // Dropped on the middle: the dragged field gets its own row before/after the target's row
  const rowIds = targetRow.map(f => f.id).filter(id => id !== draggedId);
  const movingDown = fields.findIndex(f => f.id === draggedId) < fields.findIndex(f => f.id === targetId);
  return movingDown
    ? remaining.findIndex(f => f.id === rowIds.at(-1)) + 1
    : remaining.findIndex(f => f.id === rowIds[0]);
};

// Exchanges the two fields' positions; each takes over the other's slot (and column) in the layout
const swapFields = (
  fields: FormField[],
  visibleFields: FormField[],
  inline: Set<string>,
  draggedId: string,
  targetId: string
): FieldDropResult => {
  const draggedIndex = fields.findIndex(f => f.id === draggedId);
  const targetIndex = fields.findIndex(f => f.id === targetId);
  const updated = [...fields];
  [updated[draggedIndex], updated[targetIndex]] = [updated[targetIndex], updated[draggedIndex]];

  const draggedInline = inline.has(draggedId);
  const targetInline = inline.has(targetId);
  const swappedInline = new Set(inline);
  swappedInline.delete(draggedId);
  swappedInline.delete(targetId);
  if (draggedInline) swappedInline.add(targetId);
  if (targetInline) swappedInline.add(draggedId);

  const visibleIds = new Set(visibleFields.map(f => f.id));
  const updatedRows = buildFieldRows(updated.filter(f => visibleIds.has(f.id)), [...swappedInline]);
  return { fields: updated, inlineFieldIds: getInlineIds(updatedRows) };
};

/**
 * Moves the dragged field relative to the target. Dropping on the target's left/right edge puts both
 * fields in the same row; dropping on its middle moves the dragged field to its own row.
 * When the target's row already holds two fields, an edge drop swaps the dragged field with the target.
 */
export const moveFieldOnDrop = (
  fields: FormField[],
  visibleFields: FormField[],
  inlineIds: string[],
  draggedId: string,
  targetId: string,
  position: DropPosition
): FieldDropResult | null => {
  if (draggedId === targetId) return null;

  const rows = buildFieldRows(visibleFields, inlineIds);
  const findRow = (id: string) => rows.find(row => row.some(f => f.id === id));
  const draggedRow = findRow(draggedId);
  const targetRow = findRow(targetId);
  const dragged = fields.find(f => f.id === draggedId);
  if (!dragged || !draggedRow || !targetRow) return null;
  const inline = new Set(getInlineIds(rows));
  if (position !== 'center' && targetRow.length === 2 && targetRow !== draggedRow) {
    return swapFields(fields, visibleFields, inline, draggedId, targetId);
  }

  // Leaving a row puts the dragged field's partner back on a row of its own
  draggedRow.forEach(f => inline.delete(f.id));

  const remaining = fields.filter(f => f.id !== draggedId);
  const targetIndex = remaining.findIndex(f => f.id === targetId);
  let insertAt: number;
  if (position === 'left') {
    insertAt = targetIndex;
    inline.add(targetId);
  } else if (position === 'right') {
    insertAt = targetIndex + 1;
    inline.add(draggedId);
  } else {
    insertAt = getCenterInsertIndex(fields, remaining, targetRow, draggedId, targetId);
  }

  const updated = [...remaining];
  updated.splice(insertAt, 0, dragged);

  const visibleIds = new Set(visibleFields.map(f => f.id));
  const updatedRows = buildFieldRows(updated.filter(f => visibleIds.has(f.id)), [...inline]);
  return { fields: updated, inlineFieldIds: getInlineIds(updatedRows) };
};
