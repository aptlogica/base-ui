// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import type { GridCharRemovalMode } from '../shared/gridDataOperation.types';

interface RemoveSpecialCharsPanelProps {
    columns: GridColumn[];
    selectedColumnIds: string[];
    onToggleColumn: (columnId: string) => void;
    onToggleAllColumns: () => void;
    charRemovalMode: GridCharRemovalMode;
    onCharRemovalModeChange: (value: GridCharRemovalMode) => void;
    customChar: string;
    onCustomCharChange: (value: string) => void;
}

const CHAR_FORMATS: Array<{
    value: GridCharRemovalMode;
    label: string;
    description: string;
}> = [
        {
            value: 'symbols',
            label: 'Symbols',
            description: '( @ # $ % & * ! )',
        },
        {
            value: 'currency_symbols',
            label: 'Currency Symbols',
            description: '( ₹ $ € £ )',
        },
        {
            value: 'brackets',
            label: 'Brackets',
            description: '( [ ] ( ) { } )',
        },
        {
            value: 'punctuation',
            label: 'Punctuation',
            description: '( , . : ; )',
        },
        {
            value: 'custom',
            label: 'Custom character',
            description: 'Enter specific character you want to remove.',
        }
    ];

export const RemoveSpecialCharsPanel: React.FC<RemoveSpecialCharsPanelProps> = ({
    columns,
    selectedColumnIds,
    onToggleColumn,
    onToggleAllColumns,
    charRemovalMode,
    onCharRemovalModeChange,
    customChar,
    onCustomCharChange,
}) => {
    return (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <ColumnSelectionSection
                columns={columns}
                selectedColumnIds={selectedColumnIds}
                onToggleColumn={onToggleColumn}
                onToggleAllColumns={onToggleAllColumns}
                title="Select columns"
                description="Choose the columns to clean"
            />

            <section className="space-y-2">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Select characters to remove</h3>
                    <p className="text-sm text-secondary">
                        Choose which type of characters should be removed.
                    </p>
                </div>

                <div className="space-y-2 rounded-xl border bg-card">
                    {CHAR_FORMATS.map((option, index) => (
                        <label
                            aria-label={option.label}
                            key={option.value}
                            className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50 ${index === CHAR_FORMATS.length - 1 ? '' : 'border-b'
                                }`}
                        >
                            <input
                                type="radio"
                                name="char-format"
                                checked={charRemovalMode === option.value}
                                onChange={() => onCharRemovalModeChange(option.value)}
                                className="mt-1 h-4 w-4 radio-primary-brand"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                                <span className="block text-sm text-secondary">{option.description}</span>
                            </span>
                        </label>
                    ))}
                </div>

                {charRemovalMode === 'custom' && (
                    <div className="pt-2">
                        <p className="mb-2 text-sm text-secondary">
                            Enter the character or characters you want to remove.
                        </p>
                        <input
                            type="text"
                            placeholder="e.g. #"
                            value={customChar}
                            onChange={(event) => onCustomCharChange(event.target.value)}
                            className="field-component field-component-focus field-component-border"
                        />
                    </div>
                )}
                           </section>
        </div>
    );
};
