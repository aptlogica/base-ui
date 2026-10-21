// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { AlertCircle, ArrowLeftRight, Code2, Copy, Hash, ShieldCheck, Type, X } from 'lucide-react';
import AdvancedDropdown from '../../common/dropdown/AdvancedDropdown';
import { getFieldTypeIconComponent } from '../../../types/fieldTypes';
import { useCreateTableConstraint, useUpdateTableConstraint } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import type { TableConstraint } from '../../../service/clientService';
import type { Column } from '../../../types/api.types';
import { CHECK_CATEGORIES, CUSTOM_CATEGORY, categoryByKey, fieldKind } from './checkCategories';
import {
  checkConstraintName, checkableColumns, fillExample, parseCheckStatement, previewSql, quoteIdent,
} from './checkSql';

interface CheckConstraintFormModalProps {
  table: any;
  // All columns of the table
  columns: Column[];
  // Schema-qualified Postgres table for the SQL preview
  tableName: string;
  // Set when editing; adds a new check constraint otherwise
  item?: TableConstraint;
  onClose: () => void;
}

const MAX_NAME_LENGTH = 50;
const MAX_CONDITION_LENGTH = 2000;
const FIELD_LABELS = ['Field', 'Field 2'];
const CATEGORY_ICONS: Record<string, React.ElementType> = { text: Type, number_date: Hash, compare: ArrowLeftRight, custom: Code2 };
const labelClass = 'field-component-label !text-primary';
// Same look as the query box of the trigger popup (MultiLineText)
const textareaClass = 'w-full text-[var(--color-text-primary)] p-3 rounded-[var(--radius-lg)] font-mono !text-xs leading-relaxed resize-none overflow-y-auto whitespace-pre-wrap break-words transition-all duration-200 outline-none field-component-border field-component-focus border';


// Popup to add or edit a check constraint: name, category, field(s) and an example to start from,
// then the SQL condition, the fields to insert and the SQL preview, which is the statement Apply
// runs. Custom SQL Expression is one box with the whole statement. Apply validates on the server,
// then applies.
const CheckConstraintFormModal: React.FC<CheckConstraintFormModalProps> = ({ table, columns, tableName, item, onClose }) => {
  const tableId: string = table?.id;
  const usable = checkableColumns(columns);
  const toast = useToast();
  // A new constraint's Postgres name comes from this ID, so the SQL shows the real name
  const [newId] = useState(() => crypto.randomUUID());
  const constraintName = item?.constraint_name || checkConstraintName(table?.alias || 'table', newId);

  // A new constraint starts with the first category (Text)
  const [category, setCategory] = useState(item ? categoryByKey(item.category).key : CHECK_CATEGORIES[0].key);
  const [fieldIds, setFieldIds] = useState<string[]>(['', '']);
  const [condition, setCondition] = useState(item?.condition || '');
  // Custom SQL Expression: the whole statement
  const [statement, setStatement] = useState(() => previewSql(tableName, constraintName, item?.condition || ''));
  const [name, setName] = useState(item?.title || '');
  // The name follows the example until the user types one; an existing constraint keeps its name
  const [nameEdited, setNameEdited] = useState(!!item);
  // The chosen example; while the condition isn't typed in by hand it follows the example and the fields
  const [exampleLabel, setExampleLabel] = useState('');
  const [conditionEdited, setConditionEdited] = useState(!!item);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const createConstraint = useCreateTableConstraint();
  const updateConstraint = useUpdateTableConstraint();
  const isBusy = createConstraint.isPending || updateConstraint.isPending;

  const selected = categoryByKey(category);
  const isCustom = selected.key === CUSTOM_CATEGORY;
  // Fields that suit the category first
  const suits = (column: Column) => Number(selected.suits.includes(fieldKind(column.uidt)));
  const fieldOptions = [...usable].sort((a, b) => suits(b) - suits(a));
  const columnName = (id: string) => usable.find(c => c.id === id)?.column_name;

  const title = name.trim();
  const trimmed = condition.trim();
  const conditionChanged = !item || trimmed !== (item.condition || '').trim();
  const sql = previewSql(tableName, constraintName, condition, !!item && conditionChanged);
  const canApply = title !== '' && (isCustom ? statement.trim() !== '' : trimmed !== '') && !isBusy;

  const changeCondition = (value: string) => {
    setCondition(value);
    setError('');
  };

  // Rebuilds the condition (and the name, until typed) from an example and the chosen fields
  const followExample = (label: string, ids: string[]) => {
    const example = selected.examples.find(e => e.label === label);
    if (!example) return;
    changeCondition(fillExample(example.sql, ids.map(columnName)));
    if (!nameEdited) {
      const field = usable.find(c => c.id === ids[0])?.title;
      setName((field ? `${field} · ${example.label}` : example.label).slice(0, MAX_NAME_LENGTH));
    }
  };

  // Switching to Custom SQL Expression carries the condition into the statement, and back
  const changeCategory = (key: string) => {
    if (key === CUSTOM_CATEGORY && !isCustom) {
      setStatement(previewSql(tableName, constraintName, condition));
    } else if (key !== CUSTOM_CATEGORY && isCustom) {
      const parsed = parseCheckStatement(statement, tableName);
      if ('condition' in parsed) setCondition(parsed.condition);
    }
    setCategory(key);
    // Each category has its own examples
    setExampleLabel('');
    setError('');
  };

  // A new field updates the condition while it still follows the example
  const chooseField = (index: number, id: string) => {
    const ids = fieldIds.map((v, i) => (i === index ? id : v));
    setFieldIds(ids);
    if (!exampleLabel) return;
    if (!conditionEdited) {
      followExample(exampleLabel, ids);
      return;
    }
    // Typed condition: swap the previous field's column for the new one, and refresh the name
    const before = columnName(fieldIds[index]);
    const after = columnName(id);
    if (before && after) {
      const escaped = [before, quoteIdent(before)].map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`(?<![\\w"])(?:${escaped.join('|')})(?![\\w"])`, 'g');
      if (pattern.test(condition)) {
        pattern.lastIndex = 0;
        changeCondition(condition.replace(pattern, () => quoteIdent(after)));
      } else {
        // The column was removed by hand: nothing to swap, so rebuild from the example
        setConditionEdited(false);
        followExample(exampleLabel, ids);
        return;
      }
    }
    if (!nameEdited && index === 0) {
      const field = usable.find(c => c.id === id)?.title;
      const label = selected.examples.find(e => e.label === exampleLabel)?.label ?? exampleLabel;
      setName((field ? `${field} · ${label}` : label).slice(0, MAX_NAME_LENGTH));
    }
  };

  // Picking an example (again) makes the condition follow it, replacing any typed changes
  const chooseExample = (label: string) => {
    setExampleLabel(label);
    setConditionEdited(false);
    followExample(label, fieldIds);
  };


  // The server checks the condition and the records, and applies the constraint only if all pass
  const handleApply = async () => {
    setError('');
    let applied = trimmed;
    if (isCustom) {
      const parsed = parseCheckStatement(statement, tableName);
      if ('error' in parsed) {
        setError(parsed.error);
        return;
      }
      applied = parsed.condition;
    }
    try {
      const input = { title, category, condition: applied };
      if (item) {
        await updateConstraint.mutateAsync({ id: item.id, tableId, ...input });
      } else {
        await createConstraint.mutateAsync({ id: newId, model_id: tableId, type: 'check', ...input });
      }
      toast.success('Check constraint applied');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to apply');
    }
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available: nothing to do
    }
  };

  // A dropdown like the field picker: one line per category, with its icon
  const categoryDropdown = (
    <div data-testid="check-category">
      <AdvancedDropdown
        id="check-category"
        options={CHECK_CATEGORIES.map(c => {
          const Icon = CATEGORY_ICONS[c.key] ?? Code2;
          return { label: c.label, value: c.key, icon: <Icon className="w-4 h-4" /> };
        })}
        value={category}
        onChange={value => changeCategory(String(value))}
        portal
        sort={false}
      />
    </div>
  );

  const fieldDropdowns = FIELD_LABELS.slice(0, selected.fields).map((label, index) => (
    <div key={label} className="space-y-1 min-w-0">
      <p className={labelClass}>{label}</p>
      <AdvancedDropdown
        id={`check-field-${index}`}
        options={fieldOptions.map(c => ({ label: c.title, value: c.id, icon: getFieldTypeIconComponent(c.uidt) }))}
        value={fieldIds[index] || undefined}
        onChange={value => chooseField(index, String(value))}
        placeholder="Select a field"
        searchable
        portal
        sort={false}
      />
    </div>
  ));

  // Examples in a dropdown; the condition below shows the SQL of the chosen one
  const exampleDropdown = (
    <div className="space-y-1 min-w-0">
      <p className={labelClass}>Example</p>
      <AdvancedDropdown
        id="check-example"
        options={selected.examples.map(example => ({ label: example.label, value: example.label }))}
        value={exampleLabel || undefined}
        onChange={value => chooseExample(String(value))}
        placeholder="Select an example"
        portal
        sort={false}
      />
    </div>
  );

  const body = (
    <div className="p-5 space-y-5">
      {/* Name and category side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 min-w-0">
          <label htmlFor="check-name" className={labelClass}>
            Name <span className="field-component-required">*</span>
          </label>
          <input
            id="check-name"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. Age 18–100"
            onChange={e => {
              setName(e.target.value);
              setNameEdited(true);
            }}
            className="field-component field-component-border field-component-focus border"
          />
          <p className="text-xs text-gray-500">{name.length}/{MAX_NAME_LENGTH} characters</p>
        </div>

        <div className="space-y-1 min-w-0">
          <p className={labelClass}>Category</p>
          {categoryDropdown}
          <p className="text-xs text-gray-500">{selected.description}</p>
        </div>
      </div>

      {isCustom ? (
        <div className="space-y-1">
          <label htmlFor="check-statement" className={labelClass}>
            SQL <span className="field-component-required">*</span>
          </label>
          <textarea
            id="check-statement"
            value={statement}
            spellCheck={false}
            onChange={e => {
              setStatement(e.target.value);
              setError('');
            }}
            className={`${textareaClass} h-56`}
          />
          <p className="text-xs text-gray-500">
            One ALTER TABLE … ADD CONSTRAINT … CHECK (…) statement for this table. Only the condition inside CHECK ( ) is used.
            Empty (NULL) values pass. No ";" inside, no comments, no now() or CURRENT_DATE.
          </p>
        </div>
      ) : (
        <>
          <div className={`grid gap-3 ${selected.fields === 1 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {fieldDropdowns}
            {exampleDropdown}
          </div>
          {selected.note && <p className="text-xs text-amber-700 -mt-3">{selected.note}</p>}

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="check-condition" className={labelClass}>
                Condition <span className="field-component-required">*</span>
              </label>
            </div>
            <textarea
              id="check-condition"
              value={condition}
              maxLength={MAX_CONDITION_LENGTH}
              spellCheck={false}
              placeholder="Pick a field and an example above, or write your own, e.g. age BETWEEN 18 AND 100"
              onChange={e => {
                changeCondition(e.target.value);
                setConditionEdited(true);
              }}
              className={`${textareaClass} h-24`}
            />
            <div className="flex justify-between gap-3 text-xs text-gray-400">
              <span>
                {exampleLabel && !conditionEdited
                  ? 'Follows the field and example above. Type here to change it.'
                  : exampleLabel ? 'Changed by hand. Pick the example again to reset it.' : ''}
              </span>
              <span className="flex-shrink-0">{condition.length}/{MAX_CONDITION_LENGTH}</span>
            </div>
            <p className="text-xs text-gray-500">A record is rejected only when the condition is false; empty (NULL) values pass.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className={labelClass}>SQL preview</p>
              <button type="button" onClick={copySql} className="h-6 px-2 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs text-gray-600">
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre aria-label="SQL preview" className="p-3 rounded-[var(--radius-lg)] bg-gray-50 border text-xs leading-relaxed font-mono text-gray-800 whitespace-pre-wrap break-all">{sql}</pre>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      // Escape closes this popup without closing the settings popup
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="check-constraint-form-title"
        className="bg-modal !p-0 flex flex-col relative overflow-hidden !max-w-2xl h-[720px] !max-h-[90vh] text-inherit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="check-constraint-form-title" className="text-xl font-semibold text-primary truncate">
                {item ? 'Edit' : 'Add'} check constraint
              </h2>
              <p className="text-sm text-secondary truncate">{table?.title || table?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">{body}</div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t flex-shrink-0">
          <div className="min-w-0 flex-1">
            {error && (
              <div className="text-sm flex items-center gap-1.5 text-red-600" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="px-10 py-2 rounded-xl btn-primary text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isBusy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validating…
                </>
              ) : (
                item ? 'Apply changes' : 'Apply'
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default CheckConstraintFormModal;
