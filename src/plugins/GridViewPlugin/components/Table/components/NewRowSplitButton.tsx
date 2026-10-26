// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useRef, useState } from 'react';
import { Plus, ChevronUp, LayoutGrid, ClipboardList, Check } from 'lucide-react';

export type NewRowMode = 'grid' | 'form';

const MODE_STORAGE_KEY = 'grid-new-row-mode';

const MODE_OPTIONS: { mode: NewRowMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'grid', label: 'New row - Grid', Icon: LayoutGrid },
  { mode: 'form', label: 'New row - Form', Icon: ClipboardList },
];

const readStoredMode = (): NewRowMode => {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === 'form' ? 'form' : 'grid';
  } catch {
    return 'grid';
  }
};

interface NewRowSplitButtonProps {
  onAddGridRow: () => void;
  onAddFormRow: () => void;
}

// Footer button that adds a row in the grid or opens the record form; the arrow picks which one it does
export const NewRowSplitButton: React.FC<NewRowSplitButtonProps> = ({ onAddGridRow, onAddFormRow }) => {
  const [mode, setMode] = useState<NewRowMode>(readStoredMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const runMode = (selected: NewRowMode) => {
    if (selected === 'form') onAddFormRow();
    else onAddGridRow();
  };

  const selectMode = (selected: NewRowMode) => {
    setMode(selected);
    setMenuOpen(false);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, selected);
    } catch { }
    runMode(selected);
  };

  const current = MODE_OPTIONS.find(option => option.mode === mode) ?? MODE_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative flex items-center">
      <div className="flex items-center rounded-lg border bg-card shadow-sm">
        <button
          type="button"
          onClick={() => runMode(mode)}
          className="flex items-center gap-2 pl-3 pr-3 py-1.5 text-sm font-medium text-gray-700 rounded-l-lg hover:bg-gray-100 transition-colors"
          title={current.label}
        >
          <Plus className="w-4 h-4" />
          {current.label}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          className="flex items-center self-stretch px-2 border-l text-gray-600 rounded-r-lg hover:bg-gray-100 transition-colors"
          aria-label="Choose how to add a new row"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 min-w-[220px] z-50 rounded-xl border bg-card p-1 space-y-1 shadow-lg select-none animate-fade-in"
        >
          {MODE_OPTIONS.map(({ mode: optionMode, label, Icon }) => (
            <button
              key={optionMode}
              type="button"
              role="menuitemradio"
              aria-checked={optionMode === mode}
              onClick={() => selectMode(optionMode)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg transition-colors hover:bg-gray-100 ${optionMode === mode ? 'bg-gray-100' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {optionMode === mode && <Check className="w-4 h-4 icons-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
