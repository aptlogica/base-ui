// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { FIELD_TYPE_OPERATORS, getDefaultOperator, operatorRequiresValue, parseMultiSelectValue } from '../../utils/filterUtils';
import { FieldSelectDropdown } from '../shared/table/FieldSelectDropdown';
import { DateField } from '../common/Fields/DateField';
import { MultiSelect, SingleSelect, Time } from '../common/Fields';
import type { ExportFieldInfo, ExportFilterCondition } from '../../service/baseExportService';

interface ExportTableFilterEditorProps {
  fields: ExportFieldInfo[];
  conditions: ExportFilterCondition[];
  onChange: (conditions: ExportFilterCondition[]) => void;
}

type OpenMenu = { row: number; kind: 'logic' | 'field' | 'operator' } | null;

// The look of the filter of a table view (FilterPopover): the same rows, buttons, menus and inputs
const BUTTON = 'px-3 py-1.5 text-sm text-primary bg-background border rounded-xl hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap shrink-0';
const FIELD_BUTTON = 'w-full px-3 py-1.5 text-sm text-left text-primary bg-background border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-between';
const FIELD_MENU = 'flex flex-col absolute z-50 mt-1 p-2 gap-y-1 left-0 w-full min-w-[180px] bg-background border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto';
const OPERATOR_MENU = 'flex flex-col absolute z-50 mt-1 p-2 gap-y-1 left-0 w-max bg-background border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto';
const LOGIC_MENU = 'flex flex-col absolute z-50 gap-y-1 mt-1 p-1 left-0 w-20 bg-background border rounded-xl shadow-lg';
const INPUT = 'w-full min-w-0 px-3 py-1.5 text-sm border rounded-xl bg-background text-primary placeholder-gray-400 focus:outline-none focus:border-brand-600';
const OPTION = 'rounded-xl hover:bg-(--color-bg-brand-primary) hover:text-black transition-colors';

const NUMBER_TYPES = ['number', 'decimal', 'currency', 'percent', 'year', 'rating', 'duration'];

const operatorsOf = (uidt: string) => FIELD_TYPE_OPERATORS[uidt] || FIELD_TYPE_OPERATORS.default;

/**
 * The filter builder of one table in the export dialog. It looks and works like the filter of a table view:
 * `Where <field> <operator> <value>`, then `AND` / `OR` rows, `Add filter` at the bottom. The conditions are the ones
 * a table view's filter makes, so the same operators are offered for the same field types.
 */
export const ExportTableFilterEditor: React.FC<ExportTableFilterEditorProps> = ({ fields, conditions, onChange }) => {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // a menu closes when the user clicks anywhere else
  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenu]);

  // The dialog scrolls, and a menu opens downwards: scroll so that the whole menu can be seen
  useEffect(() => {
    if (!openMenu) return;
    const frame = requestAnimationFrame(() => {
      const menu = rootRef.current?.querySelector('[data-export-filter-menu], [data-testid^="export-filter-field-options"]');
      if (menu && 'scrollIntoView' in menu) (menu as HTMLElement).scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [openMenu]);

  const update = (index: number, patch: Partial<ExportFilterCondition>) =>
    onChange(conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const remove = (index: number) => {
    setOpenMenu(null);
    onChange(conditions.filter((_, i) => i !== index));
  };

  const add = () => {
    const first = fields[0];
    if (!first) return;
    onChange([
      ...conditions,
      { column: first.id, operator: getDefaultOperator(first.uidt), value: '', ...(conditions.length > 0 ? { logic: 'AND' as const } : {}) },
    ]);
  };

  const toggle = (row: number, kind: 'logic' | 'field' | 'operator') =>
    setOpenMenu(openMenu?.row === row && openMenu.kind === kind ? null : { row, kind });

  const renderValue = (index: number, cond: ExportFilterCondition, field: ExportFieldInfo) => {
    if (!operatorRequiresValue(cond.operator) || field.uidt === 'boolean') return null;
    const options = field.options || [];
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

    const multi = field.uidt === 'multiSelect' || (field.uidt === 'select' && cond.operator.includes('any of'));
    if (multi && options.length > 0) {
      return (
        <div className="flex-1 min-w-0 w-full" onClick={stop} onKeyDown={stop}>
          <MultiSelect
            value={parseMultiSelectValue(cond.value)}
            onChange={(val: string[]) => update(index, { value: val.length > 0 ? JSON.stringify(val) : '' })}
            options={options}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }
    if (field.uidt === 'select' && options.length > 0) {
      return (
        <div className="flex-1 min-w-0 w-full" onClick={stop} onKeyDown={stop}>
          <SingleSelect value={cond.value} onChange={(val: string) => update(index, { value: val })} options={options} allowEdit={true} isBorder={true} />
        </div>
      );
    }
    if (field.uidt === 'date') {
      return (
        <div className="flex-1 min-w-0 w-full" onClick={stop}>
          <DateField
            value={cond.value}
            onChange={(v: unknown) => update(index, { value: String(v) })}
            format="YYYY-MM-DD"
            allowEdit={true}
            isBorder={true}
            config={{}}
          />
        </div>
      );
    }
    if (field.uidt === 'time') {
      return (
        <div className="flex-1 min-w-0 w-full" onClick={stop}>
          <Time
            value={cond.value}
            onChange={(v: unknown) => update(index, { value: String(v) })}
            config={{ timeFormat: 'HH:mm', hourFormat: '24' }}
            allowEdit={true}
            isBorder={true}
          />
        </div>
      );
    }
    return (
      <input
        type={NUMBER_TYPES.includes(field.uidt) ? 'number' : 'text'}
        className={INPUT}
        placeholder="Enter a value"
        value={cond.value}
        aria-label="Value"
        onChange={(e) => update(index, { value: e.target.value })}
        onClick={stop}
        onMouseDown={stop}
      />
    );
  };

  return (
    <div ref={rootRef} className="min-w-0 bg-background border border-gray-200 rounded-xl p-4">
      {conditions.map((cond, index) => {
        const field = fields.find((f) => f.id === cond.column) || fields[0];
        if (!field) return null;
        const operators = operatorsOf(field.uidt);
        const logic = cond.logic || 'AND';
        return (
          <div key={index} className="flex items-center gap-2 mb-3">
            {/* Where / AND / OR */}
            <div className="relative shrink-0">
              {index === 0 ? (
                <button type="button" className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 border rounded-xl hover:bg-gray-200">
                  Where
                </button>
              ) : (
                <>
                  <button type="button" className={BUTTON} onClick={() => toggle(index, 'logic')} aria-label="Join with the previous condition">
                    {logic}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {openMenu?.row === index && openMenu.kind === 'logic' && (
                    <div className={LOGIC_MENU} data-export-filter-menu>
                      {(['AND', 'OR'] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`w-full text-left px-3 py-1.5 text-sm ${OPTION} ${logic === value ? 'bg-(--color-bg-brand-primary) text-black' : 'text-primary'}`}
                          onClick={() => {
                            update(index, { logic: value });
                            setOpenMenu(null);
                          }}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Field */}
            <div className="relative flex-1 min-w-0">
              <FieldSelectDropdown
                options={fields.map((f) => ({ key: f.id, title: f.title, uidt: f.uidt }))}
                selectedKey={field.id}
                isOpen={openMenu?.row === index && openMenu.kind === 'field'}
                onToggle={() => toggle(index, 'field')}
                onSelect={(key) => {
                  const picked = fields.find((f) => f.id === key);
                  if (picked) update(index, { column: picked.id, operator: getDefaultOperator(picked.uidt), value: '' });
                  setOpenMenu(null);
                }}
                placeholder="Select field"
                menuTestId={`export-filter-field-options-${index}`}
                buttonClassName={FIELD_BUTTON}
                menuClassName={FIELD_MENU}
                optionClassName={(_, isSelected) =>
                  `w-full flex items-center gap-2 px-3 py-2 text-sm ${OPTION} whitespace-nowrap ${isSelected ? 'bg-(--color-bg-brand-primary) text-black' : 'text-primary'}`
                }
              />
            </div>

            {/* Operator */}
            <div className="relative shrink-0">
              <button type="button" className={BUTTON} onClick={() => toggle(index, 'operator')} aria-label="Operator">
                {operators.find((op) => op.value === cond.operator)?.label || 'is'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {openMenu?.row === index && openMenu.kind === 'operator' && (
                <div className={OPERATOR_MENU} data-export-filter-menu>
                  {operators.map((op) => (
                    <button
                      key={op.value}
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${OPTION} ${cond.operator === op.value ? 'bg-(--color-bg-brand-primary) text-black' : 'text-primary'}`}
                      onClick={() => {
                        update(index, { operator: op.value, value: operatorRequiresValue(op.value) ? cond.value : '' });
                        setOpenMenu(null);
                      }}
                    >
                      <span>{op.label}</span>
                      {cond.operator === op.value && <Check className="w-4 h-4 ml-auto text-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Value */}
            <div className="flex-1 min-w-0">{renderValue(index, cond, field)}</div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" className="p-1 text-gray-400 hover:text-red-600" onClick={() => remove(index)} aria-label="Remove filter">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-3 border-t">
        <button
          type="button"
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl ${fields.length > 0 ? 'text-primary hover:bg-(--color-bg-brand-primary) hover:text-black' : 'text-gray-400 cursor-not-allowed opacity-60'}`}
          disabled={fields.length === 0}
          onClick={add}
        >
          <Plus className="w-5 h-5" />
          Add filter
        </button>
      </div>
    </div>
  );
};
