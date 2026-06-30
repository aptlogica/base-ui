// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import type { GridMergeFormat, GridMergePlacement } from '../shared/gridDataOperation.types';

interface MergeColumnPanelProps {
    columns: GridColumn[];
    selectedColumnIds: string[];
    onToggleColumn: (columnId: string) => void;
    onToggleAllColumns: () => void;
    mergeFormat: GridMergeFormat;
    onMergeFormatChange: (value: GridMergeFormat) => void;
    mergeCustomSeparator: string;
    onMergeCustomSeparatorChange: (value: string) => void;
    mergeColumnTitle: string;
    onMergeColumnTitleChange: (value: string) => void;
    mergeKeepOriginalColumns: boolean;
    onMergeKeepOriginalColumnsChange: (value: boolean) => void;
    mergePlacement: GridMergePlacement;
    onMergePlacementChange: (value: GridMergePlacement) => void;
}

const MERGE_FORMATS: Array<{
    value: GridMergeFormat;
    label: string;
    description: string;
}> = [
        {
            value: 'space',
            label: 'Space',
            description: 'Join values with spaces.',
        },
        {
            value: 'comma',
            label: 'Comma',
            description: 'Join values with commas.',
        },
        {
            value: 'dash',
            label: 'Dash',
            description: 'Join values with dashes.',
        },
        {
            value: 'custom',
            label: 'Custom',
            description: 'Join values with a custom separator.',
        },
    ];

export const MergeColumnPanel: React.FC<MergeColumnPanelProps> = ({
    columns,
    selectedColumnIds,
    onToggleColumn,
    onToggleAllColumns,
    mergeFormat,
    onMergeFormatChange,
    mergeCustomSeparator,
    onMergeCustomSeparatorChange,
    mergeColumnTitle,
    onMergeColumnTitleChange,
    mergeKeepOriginalColumns,
    onMergeKeepOriginalColumnsChange,
    mergePlacement,
    onMergePlacementChange,
}) => {
    return (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <ColumnSelectionSection
                columns={columns}
                selectedColumnIds={selectedColumnIds}
                onToggleColumn={onToggleColumn}
                onToggleAllColumns={onToggleAllColumns}
                title="Column to merge"
                description="Select two or more columns to merge."
            />

            <section className="space-y-2">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Merge format</h3>
                    <p className="text-sm text-secondary">
                        Choose how values should be combined.
                    </p>
                </div>

                <div className="space-y-2 rounded-xl border bg-card">
                    {MERGE_FORMATS.map((option, index) => (
                        <div
                            key={option.value}
                            className={index === MERGE_FORMATS.length - 1 ? '' : 'border-b'}
                        >
                            <label
                                aria-label={option.label}
                                className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50"
                            >
                                <input
                                    type="radio"
                                    name="merge-format"
                                    checked={mergeFormat === option.value}
                                    onChange={() => onMergeFormatChange(option.value)}
                                    className="mt-1 h-4 w-4 radio-primary-brand"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-foreground">{option.label}</span>
                                    <span className="block text-sm text-secondary">{option.description}</span>
                                </span>
                            </label>
                            {option.value === 'custom' && mergeFormat === 'custom' && (
                                <div className="space-y-2 px-4 pb-4">
                                    <input
                                        type="text"
                                        value={mergeCustomSeparator}
                                        onChange={(event) => onMergeCustomSeparatorChange(event.target.value)}
                                        placeholder="Enter custom separator"
                                        className="w-full h-11 px-4 border rounded-xl bg-alpha-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed text-foreground"
                                    />
                                    <p className="text-sm text-secondary">This will be the separator for the new merged column.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">New column</h3>
                    <p className="text-sm text-secondary">
                        Provide a name for the new column.
                    </p>
                </div>
                <div className='space-y-2'>
                    <h2 className="text-sm text-foreground">Column name</h2>
                    <input
                        type="text"
                        value={mergeColumnTitle}
                        onChange={(event) => onMergeColumnTitleChange(event.target.value)}
                        placeholder="Enter column name"
                        className="w-full h-11 px-4 border rounded-xl bg-alpha-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed text-foreground"
                    />
                    <p className="text-sm text-secondary">This will be the header for the new merged column.</p>
                </div>
                <div className='space-y-2'>
                    <h3 className="text-sm font-semibold text-foreground">Output Option</h3>
                    <label
                        aria-label="keep-original-column"
                        key="keep-original-column"
                        className="flex cursor-pointer items-start gap-3"
                    >
                        <input
                            type="checkbox"
                            name="merge-keep-original-columns"
                            checked={mergeKeepOriginalColumns}
                            onChange={(event) => onMergeKeepOriginalColumnsChange(event.target.checked)}
                            className="mt-1 h-4 w-4 checkbox-primary-brand text-foreground"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm text-foreground">Keep original column</span>
                            <span className="block text-sm text-secondary">
                                Keep the original column after applying changes.
                            </span>
                        </span>
                    </label>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Where to add new columns</h3>
                    <label
                        aria-label="at-end-of-table"
                        key="at-end-of-table"
                        className="flex cursor-pointer items-start gap-3"
                    >
                        <input
                            type="checkbox"
                            name="merge-placement"
                            checked={mergePlacement === 'end_of_table'}
                            onChange={(event) =>
                                onMergePlacementChange(event.target.checked ? 'end_of_table' : 'next_to_original')
                            }
                            className="mt-1 h-4 w-4 checkbox-primary-brand text-foreground"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm text-foreground">At end of table</span>
                        </span>
                    </label>
                </div>
            </section>
        </div>
    );
};
