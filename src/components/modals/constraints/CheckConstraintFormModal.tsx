// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowLeftRight, Code2, Copy, ListFilter, ShieldCheck, X } from 'lucide-react';
import AdvancedDropdown from '../../common/dropdown/AdvancedDropdown';
import { getFieldTypeIconComponent } from '../../../types/fieldTypes';
import { useCreateTableConstraint, useUpdateTableConstraint } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import type { CheckExample, FieldKind, ValueSpec } from './checkCategories';
import type { TableConstraint } from '../../../service/clientService';
import type { Column } from '../../../types/api.types';
import { CHECK_CATEGORIES, CUSTOM_CATEGORY, categoryByKey, examplesFor, fieldKind, savedCategoryKey, suitsCategory } from './checkCategories';
import {
  buildCondition, checkConstraintName, displayName, checkableColumns, insertColumn, matchExample, parseCheckStatement, previewSql, toColumnNames, toTitles, valueSql,
} from './checkSql';

interface CheckConstraintFormModalProps {
  table: any;
  // All columns of the table
  columns: Column[];
  // Schema-qualified Postgres table for the SQL preview
  tableName: string;
  // Set when editing; adds a new check constraint otherwise
  item?: TableConstraint;
  // Titles of the table's check constraints, to refuse a name that is already used
  existingTitles?: string[];
  onClose: () => void;
}

const MAX_NAME_LENGTH = 50;
const FIELD_LABELS = ['Field', 'Field 2'];
const CATEGORY_ICONS: Record<string, React.ElementType> = { field: ListFilter, compare: ArrowLeftRight, custom: Code2 };
const labelClass = 'field-component-label !text-primary';
// Same look as the query box of the trigger popup (MultiLineText)
const textareaClass = 'w-full text-[var(--color-text-primary)] p-3 rounded-[var(--radius-lg)] font-mono !text-xs leading-relaxed resize-none overflow-y-auto whitespace-pre-wrap break-words transition-all duration-200 outline-none field-component-border field-component-focus border';


// Popup to add or edit a check constraint: name and category, then one filter-like row: the field(s),
// a common condition and the value(s) it needs, and the SQL preview, which is the statement Apply
// runs. Custom SQL Expression is one box with the whole statement. Apply validates on the server,
// then applies.
// A new constraint starts with the first category (Single Field); a saved one with its own, or custom SQL
const startCategory = (item: any, saved: ReturnType<typeof matchExample>): string => {
  if (!item) return CHECK_CATEGORIES[0].key;
  return saved ? saved.categoryKey : CUSTOM_CATEGORY;
};

// Another check constraint of this table with the same name (letter case aside) is refused
const nameProblemOf = (value: string, existingTitles: string[]): string => {
  if (value === '') return 'Name is required';
  const taken = existingTitles.some(t => t.trim().toLowerCase() === value.toLowerCase());
  return taken ? `A check constraint named "${value}" already exists` : '';
};

// The HTML input type for a value of this kind; a plain value follows the type of the first field
const inputTypeOf = (kind: string, firstKind?: string): string => {
  if (kind === 'number') return 'number';
  if (kind !== 'value') return 'text';
  return { number: 'number', date: 'date' }[firstKind as string] ?? 'text';
};

// The condition for the chosen example; empty while none is chosen
const conditionOf = (
  example: CheckExample | undefined, names: (string | undefined)[], values: string[], kind: FieldKind,
  quote?: (name: string) => string,
): { condition: string; complete: boolean } =>
  example ? buildCondition(example, names, values, kind, quote) : { condition: '', complete: false };

// The name a constraint gets from its first field and condition
const autoNameOf = (field: string | undefined, label: string): string =>
  (field ? `${field} · ${label}` : label).slice(0, MAX_NAME_LENGTH);

// Where a field goes before the statement box was used: inside CHECK ( )
const insideCheck = (statement: string): { start: number; end: number } => {
  const open = /CHECK\s*\(/i.exec(statement);
  const at = open ? open.index + open[0].length : statement.length;
  return { start: at, end: at };
};

const CheckConstraintFormModal: React.FC<CheckConstraintFormModalProps> = ({ table, columns, tableName, item, existingTitles = [], onClose }) => {
  const tableId: string = table?.id;
  const usable = checkableColumns(columns);
  const toast = useToast();
  // A new constraint's Postgres name comes from this ID, so the SQL shows the real name
  const [newId] = useState(() => crypto.randomUUID());
  const constraintName = item?.constraint_name || checkConstraintName(table?.alias || 'table', newId);
  const columnOf = (name: string) => usable.find(c => c.column_name === name);

  // A saved condition made from a common condition opens as that condition with its field and values;
  // any other opens as custom SQL
  const [saved] = useState(() => (item
    ? matchExample(item.condition || '', item.category, usable.map(c => c.column_name), n => fieldKind(columnOf(n)?.uidt))
    : null));

  // A new constraint starts with the first category (Single Field)
  const [category, setCategory] = useState(() => startCategory(item, saved));
  const [fieldIds, setFieldIds] = useState<string[]>(
    () => [0, 1].map(i => (saved?.columnNames[i] ? columnOf(saved.columnNames[i])?.id ?? '' : '')));
  const [exampleLabel, setExampleLabel] = useState(saved?.example.label ?? '');
  const [values, setValues] = useState<string[]>(() => [saved?.values[0] ?? '', saved?.values[1] ?? '']);
  // Custom SQL Expression: the whole statement
  const [statement, setStatement] = useState(() => previewSql(tableName, constraintName, toTitles(item?.condition || '', usable)));
  const [name, setName] = useState(item?.title || '');
  // The name follows the field and condition until the user types one; an existing constraint keeps its name
  const [nameEdited, setNameEdited] = useState(!!item);
  const [error, setError] = useState('');
  // Set when Apply is clicked with no name or a name already used, so the field is highlighted in red
  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  // Custom SQL box and where the cursor last was in it, for inserting a field
  const statementRef = useRef<HTMLTextAreaElement>(null);
  const statementCursor = useRef<{ start: number; end: number } | null>(null);

  const createConstraint = useCreateTableConstraint();
  const updateConstraint = useUpdateTableConstraint();
  const isBusy = createConstraint.isPending || updateConstraint.isPending;

  const selected = categoryByKey(category);
  const isCustom = selected.key === CUSTOM_CATEGORY;
  // Only fields the category has conditions for; an already chosen field stays so it can be changed
  const optionsFor = (index: number) => usable.filter(c => {
    if (fieldIds.includes(c.id)) return true;
    if (!suitsCategory(selected, c.uidt)) return false;
    // Comparing needs the same kind on both sides
    const first = usable.find(f => f.id === fieldIds[0]);
    return !(selected.fields === 2 && index === 1 && first && fieldKind(first.uidt) !== fieldKind(c.uidt));
  });
  const columnName = (id: string) => usable.find(c => c.id === id)?.column_name;
  const firstFieldKind = fieldKind(usable.find(c => c.id === fieldIds[0])?.uidt);

  // The condition follows the chosen example, fields and values
  // The conditions offered follow the type of the first field
  const offered = examplesFor(selected, fieldIds[0] ? firstFieldKind : undefined);
  const example = offered.find(e => e.label === exampleLabel);
  const built = conditionOf(example, fieldIds.map(columnName), values, firstFieldKind);
  const condition = built.condition;

  const title = name.trim();
  const conditionChanged = !item || condition.trim() !== (item.condition || '').trim();
  const replacing = !!item && conditionChanged;
  // The SQL that runs, and the preview of it, which shows the field titles instead of the column names
  const sql = previewSql(tableName, constraintName, condition || '<condition>', replacing);
  const shownCondition = conditionOf(
    example, fieldIds.map(id => usable.find(c => c.id === id)?.title), values, firstFieldKind, displayName).condition;
  const shownSql = previewSql(tableName, constraintName, shownCondition || '<condition>', replacing);
  const applyLabel = item ? 'Apply changes' : 'Apply';
  const actionWord = item ? 'Edit' : 'Add';
  const copyLabel = copied ? 'Copied' : 'Copy';
  const nameLabelClass = nameError ? '!text-red-600' : '!text-primary';
  const nameInputClass = nameError ? '!border-red-500 focus:!border-red-500 bg-red-50' : 'field-component-border';
  const canApply = (isCustom ? statement.trim() !== '' : built.complete) && !isBusy;

  // The name follows the first field and the condition, until it is typed in
  const autoName = (fieldId: string, label: string) => {
    if (nameEdited) return;
    setName(autoNameOf(usable.find(c => c.id === fieldId)?.title, label));
  };

  // Switching to Custom SQL Expression carries the condition into the statement
  const changeCategory = (key: string) => {
    if (key === CUSTOM_CATEGORY && !isCustom) {
      setStatement(previewSql(tableName, constraintName, built.complete ? toTitles(condition, usable) : ''));
    }
    setCategory(key);
    // Each category has its own conditions
    setExampleLabel('');
    setValues(['', '']);
    setError('');
  };

  const chooseField = (index: number, id: string) => {
    setFieldIds(fieldIds.map((v, i) => (i === index ? id : v)));
    setError('');
    if (index !== 0) return;
    // A field of another type may not offer the chosen condition
    if (!example) return;
    if (examplesFor(selected, fieldKind(usable.find(c => c.id === id)?.uidt)).includes(example)) {
      autoName(id, example.label);
    } else {
      setExampleLabel('');
      setValues(['', '']);
    }
  };

  // A different condition needs different values, so they start empty
  const chooseExample = (label: string) => {
    setExampleLabel(label);
    setValues(['', '']);
    setError('');
    autoName(fieldIds[0], label);
  };

  const changeValue = (index: number, value: string) => {
    setValues(values.map((v, i) => (i === index ? value : v)));
    setError('');
  };

  // The server checks the condition and the records, and applies the constraint only if all pass
  const handleApply = async () => {
    setError('');
    const nameProblem = nameProblemOf(title, existingTitles);
    if (nameProblem) {
      setNameError(true);
      nameInputRef.current?.focus();
      setError(nameProblem);
      return;
    }
    const parsed = isCustom ? parseCheckStatement(statement, tableName) : { condition };
    if ('error' in parsed) {
      setError(parsed.error);
      return;
    }
    const applied = isCustom ? toColumnNames(parsed.condition, usable) : parsed.condition;
    try {
      const input = { title, category: savedCategoryKey(category, firstFieldKind), condition: applied };
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

  // Puts the field's column name into the statement at the cursor; before the box was used, inside CHECK ( )
  const insertField = (id: string) => {
    const column = usable.find(c => c.id === id);
    if (!column) return;
    const cursor = statementCursor.current ?? insideCheck(statement);
    const inserted = insertColumn(statement, column.title, cursor, displayName);
    setStatement(inserted.condition);
    setError('');
    statementCursor.current = { start: inserted.cursor, end: inserted.cursor };
    // The box is controlled: the cursor is put back after the new text is shown
    setTimeout(() => {
      statementRef.current?.focus();
      statementRef.current?.setSelectionRange(inserted.cursor, inserted.cursor);
    });
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
        options={optionsFor(index).map(c => ({ label: c.title, value: c.id, icon: getFieldTypeIconComponent(c.uidt) }))}
        value={fieldIds[index] || undefined}
        onChange={value => chooseField(index, String(value))}
        placeholder="Select a field"
        searchable
        portal
        sort={false}
      />
    </div>
  ));

  // Common conditions in a dropdown; the value inputs next to it are the ones the chosen one needs
  const exampleDropdown = (
    <div className="space-y-1 min-w-0">
      <p className={labelClass}>Common conditions</p>
      <AdvancedDropdown
        id="check-example"
        options={offered.map(e => ({ label: e.label, value: e.label }))}
        value={exampleLabel || undefined}
        onChange={value => chooseExample(String(value))}
        placeholder="Select a condition"
        portal
        sort={false}
      />
    </div>
  );

  const specs = example?.values ?? [];
  const valueInput = (spec: ValueSpec, index: number, label: string) => {
    const invalid = values[index].trim() !== '' && valueSql(spec.kind, values[index], firstFieldKind) === null;
    return (
      <input
        key={label}
        id={`check-value-${index}`}
        aria-label={label}
        type={inputTypeOf(spec.kind, firstFieldKind)}
        value={values[index]}
        placeholder={spec.placeholder}
        aria-invalid={invalid}
        onChange={e => changeValue(index, e.target.value)}
        className={`field-component field-component-border field-component-focus border min-w-0 ${invalid ? '!border-red-500' : ''}`}
      />
    );
  };

  // Third cell of the row, always there so the row keeps one structure: the value(s) of the chosen
  // condition, or the second field when comparing two fields
  const thirdCell = selected.fields === 2 ? fieldDropdowns[1] : (
    <div className="space-y-1 min-w-0">
      <p className={labelClass}>Value</p>
      {specs.length === 0 && (
        <input
          type="text"
          aria-label="Value"
          disabled
          placeholder={example ? 'No value needed' : 'Value'}
          className="field-component field-component-border border min-w-0 disabled:opacity-60"
        />
      )}
      {specs.length === 1 && valueInput(specs[0], 0, 'Value')}
      {specs.length === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {valueInput(specs[0], 0, 'From')}
          {valueInput(specs[1], 1, 'To')}
        </div>
      )}
    </div>
  );

  const body = (
    <div className="p-5 space-y-5">
      {/* Name and category side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 min-w-0">
          <label htmlFor="check-name" className={`field-component-label ${nameLabelClass}`}>
            Name <span className="field-component-required">*</span>
          </label>
          <input
            id="check-name"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            ref={nameInputRef}
            aria-invalid={nameError}
            placeholder="e.g. Valid employee status"
            onChange={e => {
              setName(e.target.value);
              setNameEdited(true);
              if (nameError) {
                setNameError(false);
                setError('');
              }
            }}
            className={`field-component field-component-focus border ${nameInputClass}`}
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
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="check-statement" className={labelClass}>
              SQL <span className="field-component-required">*</span>
            </label>
            {/* Adds the column name at the cursor, so the field name needn't be typed */}
            <div className="w-56" data-testid="insert-field">
              <AdvancedDropdown
                id="check-insert-field"
                options={usable.map(c => ({ label: c.title, value: c.id, icon: getFieldTypeIconComponent(c.uidt) }))}
                value={undefined}
                onChange={value => insertField(String(value))}
                placeholder="Insert a field"
                searchable
                portal
                sort={false}
              />
            </div>
          </div>
          <textarea
            id="check-statement"
            ref={statementRef}
            value={statement}
            spellCheck={false}
            onSelect={e => {
              statementCursor.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
            }}
            onChange={e => {
              setStatement(e.target.value);
              setError('');
            }}
            className={`${textareaClass} h-56`}
          />
          <p className="text-xs text-gray-500">
            One ALTER TABLE … ADD CONSTRAINT … CHECK (…) statement for this table. Use Insert a field to add a column name at the cursor. Only the condition inside CHECK ( ) is used.
            Empty (NULL) values pass. No ";" inside, no comments, no now() or CURRENT_DATE.
          </p>
        </div>
      ) : (
        <>
          {/* One row, like a filter: field, condition, value(s); the same three columns for every condition */}
          <div className="grid grid-cols-3 gap-3">
            {fieldDropdowns[0]}
            {exampleDropdown}
            {thirdCell}
          </div>
          {selected.note && <p className="text-xs text-amber-700 -mt-3">{selected.note}</p>}
          <p className="text-xs text-gray-500">A record is rejected only when the condition is false; empty (NULL) values pass.</p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className={labelClass}>SQL preview</p>
              <button type="button" onClick={copySql} className="h-6 px-2 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs text-gray-600">
                <Copy className="w-3.5 h-3.5" />
                {copyLabel}
              </button>
            </div>
            <pre aria-label="SQL preview" className="p-3 rounded-[var(--radius-lg)] bg-gray-50 border text-xs leading-relaxed font-mono text-gray-800 whitespace-pre-wrap break-all">{shownSql}</pre>
            <p className="text-xs text-gray-500">Field titles are shown here. The real column names are used when you apply, and Copy copies them.</p>
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
        className="bg-modal !p-0 flex flex-col relative overflow-hidden !max-w-3xl h-[720px] !max-h-[90vh] text-inherit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="check-constraint-form-title" className="text-xl font-semibold text-primary truncate">
                {actionWord} check constraint
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
        <div className="flex-1 min-h-0 overflow-y-auto">
          {body}
          {error && (
            <div className="px-5 pb-5">
              <div className="text-sm flex items-center gap-1 text-red-600" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t flex-shrink-0">
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
              ) : applyLabel}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default CheckConstraintFormModal;
