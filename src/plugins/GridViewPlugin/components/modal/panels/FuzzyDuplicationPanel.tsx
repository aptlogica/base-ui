// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Info } from 'lucide-react';
import type { GridColumn } from '../../../types/grid.types';
import { ColumnSelectionSection } from '../shared/ColumnSelectionSection';
import { Dropdown } from '../../shared';
import AdvancedDropdown from '../../../../../components/common/dropdown/AdvancedDropdown';

type MatchingMethod = 'similar' | 'phonetic' | 'ignore';

interface FuzzyDuplicationPanelProps {
    columns: GridColumn[];
    selectedColumnIds: string[];
    onToggleColumn: (columnId: string) => void;
    onToggleAllColumns: () => void;
}

const MATCHING_METHOD_OPTIONS: Array<{
    value: MatchingMethod;
    label: string;
    description: string;
}> = [
        {
            value: 'similar',
            label: 'Similar text',
            description: 'Match similar spellings',
        },
        {
            value: 'phonetic',
            label: 'Phonetic match',
            description: 'Match similar sounding values',
        },
        {
            value: 'ignore',
            label: 'Ignore formatting',
            description: 'Ignore spaces and formatting',
        },
    ];

const MATCH_SENSITIVITY_OPTIONS: Array<{
    value: string;
    label: string;
    description: string;
}> = [
        {
            value: 'low',
            label: 'Low',
            description: 'Only match records with very similar values'
        },
        {
            value: 'medium',
            label: 'Medium',
            description: 'Match records with moderate similarities'
        },
        {
            value: 'high',
            label: 'High',
            description: 'Match records with broader similarities'
        }
    ];

const KEEP_RULE_OPTIONS: Array<{
    value: string;
    label: string;
}> = [
        {
            value: 'keep_first',
            label: 'Keep first occurrence '
        },
        {
            value: 'keep_last',
            label: 'Keep last occurrence'
        },
        {
            value: 'keep_lastest_updated',
            label: 'Keep last updated record'
        },
        {
            value: 'keep_highest',
            label: 'Keep highest value'
        },
        {
            value: 'keep_lowest',
            label: 'Keep lowest value'
        }
    ];

export const FuzzyDuplicationPanel: React.FC<FuzzyDuplicationPanelProps> = ({
    columns,
    selectedColumnIds,
    onToggleColumn,
    onToggleAllColumns
}) => {
    return (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <ColumnSelectionSection
                columns={columns}
                selectedColumnIds={selectedColumnIds}
                onToggleColumn={onToggleColumn}
                onToggleAllColumns={onToggleAllColumns}
                title="Identify duplicates by"
                description="Select one or more columns to identify duplicates."
            />

            <section className="space-y-4">
                <div className="space-y-2">
                    <div>
                        <h3 className="text-sm font-semibold text-primary">Matching Method</h3>
                        <p className="text-sm text-secondary">
                            Choose the method used to find similar values.
                        </p>
                    </div>
                    <AdvancedDropdown
                        options={MATCHING_METHOD_OPTIONS}
                        value={MATCHING_METHOD_OPTIONS[0].value}
                        onChange={(value) => console.log('Selected matching method:', value)}
                    />
                </div>
                <div className="space-y-2">
                    <div>
                        <h3 className="text-sm font-semibold text-primary">Matching Sensitivity</h3>
                        <p className="text-sm text-secondary">
                            Choose how strictly records should be matched.
                        </p>
                    </div>
                    <div className="space-y-2 rounded-xl border bg-card">
                        {MATCH_SENSITIVITY_OPTIONS.map((option, index) => (
                            <label
                                aria-label={option.label}
                                key={option.value}
                                className={`flex cursor-pointer items-start gap-3 px-2 py-3 hover:bg-muted/50 ${index === MATCH_SENSITIVITY_OPTIONS.length - 1 ? '' : 'border-b'}`}
                            >
                                <input
                                    type="radio"
                                    name="duplicate-action"
                                    className="mt-1 h-4 w-4 radio-primary-brand"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-foreground">{option.label}</span>
                                    <span className="block text-sm text-secondary">{option.description}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Keep rule</h3>
                        <p className="text-sm text-secondary">
                            Choose which records to keep as the original.
                        </p>
                    </div>
                    <Dropdown
                        options={KEEP_RULE_OPTIONS}
                        value={KEEP_RULE_OPTIONS[0].label}
                        onChange={(value) => console.log('Selected keep rule:', value)}
                    />
                </div>
            </section>

            <div className="space-y-2 border-t"></div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <div className="flex items-center gap-2">
                    <Info className="h-8 w-8 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                        <p className="text-foreground">
                           <span className="text-indigo-700">10</span> duplicates detected
                        </p>
                        <p className="text-foreground">
                            <span className="text-indigo-700">4</span> row will be affected
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
