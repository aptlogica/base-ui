// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { isLegacyTitleColumn } from '../../../utils/recordLabel';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Search, Check } from 'lucide-react';
import type { Column } from '../../../types/api.types';
import { columnBlockReason } from './constraintUtils';

interface ColumnPickerProps {
  // All columns of the table
  columns: Column[];
  // Chosen column IDs
  value: string[];
  onChange: (value: string[]) => void;
}

// Room the dropdown wants: search box plus about 6 rows
const DROPDOWN_HEIGHT = 300;
const GAP = 4;

type Position = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

// Chosen columns as chips, with a searchable dropdown to add more. The dropdown is portaled to
// document.body and placed next to the field, so the popup it's in can't clip it.
const ColumnPicker: React.FC<ColumnPickerProps> = ({ columns, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const byId = new Map(columns.map(c => [c.id, c]));

  // Below the field, or above it when there's more room there
  const place = useCallback(() => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - GAP;
    const above = rect.top - GAP;
    const openAbove = below < DROPDOWN_HEIGHT && above > below;
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(openAbove ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      maxHeight: Math.max(160, Math.min(DROPDOWN_HEIGHT, (openAbove ? above : below) - 8)),
    });
  }, []);

  // Placed again when chips are added or removed, since the field can change height
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, value.length]);

  // Focus the search once the dropdown is placed and shown
  const isShown = open && !!position;
  useEffect(() => {
    if (isShown) searchRef.current?.focus();
  }, [isShown]);

  // While open: follow the field on scroll and resize, close on a click outside
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!fieldRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  const query = search.trim().toLowerCase();
  // System columns (Id, created and modified time and by) are hidden; Title is a normal field to users
  // (the system Title of a table created before Title became an ordinary column is shown too).
  // Usable columns first, then the ones a key can't use.
  const listed = columns
    .filter(c => !c.system || isLegacyTitleColumn(c))
    .filter(c => !query || c.title.toLowerCase().includes(query))
    .sort((a, b) => Number(!!columnBlockReason(a)) - Number(!!columnBlockReason(b)));

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);

  const dropdown = isShown && ReactDOM.createPortal(
    <div //NOSONAR
      ref={dropdownRef}
      className="fixed z-10000 bg-card border rounded-xl shadow-lg flex flex-col overflow-hidden"
      style={{ left: position?.left, width: position?.width, top: position?.top, bottom: position?.bottom, maxHeight: position?.maxHeight }}
      // Escape closes only the dropdown, not the popup it belongs to
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <div className="p-2 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search columns"
            className="w-full text-sm pl-8 pr-3 h-8 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none"
          />
        </div>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto py-1" aria-label="Columns">
        {listed.length === 0 && (
          <li className="px-3 py-3 text-sm text-gray-500 text-center">No columns match "{search.trim()}"</li>
        )}
        {listed.map(column => {
          const reason = columnBlockReason(column);
          const checked = value.includes(column.id);
          const disabled = !!reason;
          return (
            <li key={column.id}>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => toggle(column.id)}
                title={reason || undefined}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {checked && <Check className="w-4 h-4 text-green-600" />}
                </span>
                <span className={`flex-1 text-sm truncate ${reason ? 'text-gray-400' : 'text-primary'}`}>{column.title}</span>
                {reason && <span className="text-xs text-gray-400 shrink-0">Not allowed</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body
  );

  return (
    <>
      <div ref={fieldRef} className="min-h-10 w-full flex flex-wrap items-center gap-1.5 px-2 py-1.5 border rounded-lg bg-background">
        {value.map(id => (
          <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-green-50 border border-green-200 text-sm text-green-800">
            {byId.get(id)?.title || 'Deleted column'}
            <button
              type="button"
              aria-label={`Remove ${byId.get(id)?.title || 'column'}`}
              onClick={() => onChange(value.filter(v => v !== id))}
              className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
        >
          <Plus className="w-4 h-4" />
          {value.length === 0 ? 'Choose columns' : 'Add column'}
        </button>
      </div>
      {dropdown}
    </>
  );
};

export default ColumnPicker;
