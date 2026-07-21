// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import type { GridColumn } from '../../../types/grid.types';
import type { GridActionDefinition } from '../../toolbar/gridActionCatalog';
import type {
  GridCaseFormat,
  GridDuplicateAction,
  GridCharRemovalMode,
  GridExtractMethod,
  GridExtractPlacement,
  GridExtractType,
  GridFormattingMode,
  GridDataOperationState,
  GridSplitFixedDirection,
  GridSplitMode,
  GridSplitOutputMode,
  GridSplitPlacement,
  GridSplitSeparatorType,
  GridSpaceMode,
  GridFindReplaceMatchMode,
  GridDuplicateKeepRule,
  GridMergeFormat,
  GridMergePlacement,
} from './gridDataOperation.types';
import { CaseNormalizationPanel } from '../panels/CaseNormalizationPanel';
import { ExtraspacePanel } from '../panels/ExtraspacePanel';
import { ColumnSelectionSection } from './ColumnSelectionSection';
import { FormattingPanel } from '../panels/RemoveFormatting';
import { FindAndReplacePanel } from '../panels/FindAndReplacePanel';
import { RemoveDuplicatesPanel } from '../panels/RemoveDuplicatesPanel';
import { RemoveSpecialCharsPanel } from '../panels/RemoveSpecialCharsPanel';
import { SplitColumnPanel } from '../panels/SplitColumnPanel';
import { MergeColumnPanel } from '../panels/MergeColumnPanel';
import { ExtractSubstringPanel } from '../panels/ExtractSubstring';
import { FuzzyDuplicationPanel } from '../panels/FuzzyDuplicationPanel';
import { filterGridDataOperationColumns, getGridColumnIdentity } from './gridColumnIdentity';

interface GridDataOperationPanelProps {
  action: GridActionDefinition;
  columns: GridColumn[];
  state: GridDataOperationState;
  onStateChange: (patch: Partial<GridDataOperationState>) => void;
  preview?: any;
}

export const GridDataOperationPanel: React.FC<GridDataOperationPanelProps> = ({
  action,
  columns,
  state,
  onStateChange,
  preview,
}) => {
  const { scope, selectedColumnIds, caseFormat, spaceMode, matchingCase, charRemovalMode, customChar } = state;
  const columnOptions = useMemo(
    () => filterGridDataOperationColumns(columns),
    [columns]
  );

  const suggestMergeColumnTitle = (columnIds: string[]) => {
    if (columnIds.length < 2) return '';

    return columnOptions
      .filter((column) => columnIds.includes(getGridColumnIdentity(column)))
      .map((column) => String(column.title || column.column_name || ''))
      .filter(Boolean)
      .join(' ');
  };

  const toggleColumn = (columnId: string) => {
    const nextSelected = selectedColumnIds.includes(columnId)
      ? selectedColumnIds.filter((id) => id !== columnId)
      : [...selectedColumnIds, columnId];

    const patch: Partial<GridDataOperationState> = { selectedColumnIds: nextSelected };

    if (action.id === 'merge_column') {
      if (nextSelected.length >= 2 && !state.mergeColumnTitle.trim()) {
        patch.mergeColumnTitle = suggestMergeColumnTitle(nextSelected);
      }
      if (nextSelected.length < 2) {
        patch.mergeColumnTitle = state.mergeColumnTitle && nextSelected.length === 0 ? '' : state.mergeColumnTitle;
      }
    }

    onStateChange(patch);
  };

  const toggleAllColumns = () => {
    if (selectedColumnIds.length === columnOptions.length) {
      onStateChange({ selectedColumnIds: [] });
      return;
    }

    onStateChange({
      selectedColumnIds: columnOptions.map((column) => getGridColumnIdentity(column)),
    });
  };

  const setCaseFormat = (value: GridCaseFormat) => {
    onStateChange({ caseFormat: value });
  };

  const setSpaceMode = (value: GridSpaceMode) => {
    onStateChange({ spaceMode: value });
  };

  const setFindText = (value: string) => {
    onStateChange({ findText: value });
  };

  const setReplaceText = (value: string) => {
    onStateChange({ replaceText: value });
  };

  const setMatchingCase = (value: GridFindReplaceMatchMode) => {
    onStateChange({ matchingCase: value });
  };

  const setCharRemovalMode = (value: GridCharRemovalMode) => {
    onStateChange({ charRemovalMode: value });
  };

  const setCustomChar = (value: string) => {
    onStateChange({ customChar: value });
  }

  const setFormatting = (value: GridFormattingMode) => {
    onStateChange({ formatting: value });
  };

  const setFormattingPattern = (value: string) => {
    onStateChange({ formattingPattern: value });
  };

  const setDuplicateKeepRule = (value: GridDuplicateKeepRule) => {
    onStateChange({ duplicateKeepRule: value });
  };

  const setDuplicateAction = (value: GridDuplicateAction) => {
    onStateChange({ duplicateAction: value });
  };

  const setScope = (value: GridDataOperationState['scope']) => {
    onStateChange({ scope: value });
  };

  const setSplitSourceColumnId = (value: string) => {
    onStateChange({
      splitSourceColumnId: value,
      selectedColumnIds: value ? [value] : [],
    });
  };

  const clearSplitSourceColumn = () => {
    onStateChange({
      splitSourceColumnId: '',
      selectedColumnIds: [],
    });
  };

  const setSplitMode = (value: GridSplitMode) => {
    onStateChange({ splitMode: value });
  };

  const setSplitSeparatorType = (value: GridSplitSeparatorType) => {
    onStateChange({ splitSeparatorType: value });
  };

  const setSplitCustomSeparator = (value: string) => {
    onStateChange({ splitCustomSeparator: value });
  };

  const setSplitMaxColumns = (value: string) => {
    onStateChange({ splitMaxColumns: value });
  };

  const setSplitFixedDirection = (value: GridSplitFixedDirection) => {
    onStateChange({ splitFixedDirection: value });
  };

  const setSplitCharacterCount = (value: string) => {
    onStateChange({ splitCharacterCount: value });
  };

  const setSplitPattern = (value: string) => {
    onStateChange({ splitPattern: value });
  };

  const setSplitOutputMode = (value: GridSplitOutputMode) => {
    onStateChange({ splitOutputMode: value });
  };

  const setSplitPlacement = (value: GridSplitPlacement) => {
    onStateChange({ splitPlacement: value });
  };

  const setMergeFormat = (value: GridMergeFormat) => {
    onStateChange({ mergeFormat: value });
  };

  const setMergeCustomSeparator = (value: string) => {
    onStateChange({ mergeCustomSeparator: value });
  };

  const setMergeColumnTitle = (value: string) => {
    onStateChange({ mergeColumnTitle: value });
  };

  const setMergeKeepOriginalColumns = (value: boolean) => {
    onStateChange({ mergeKeepOriginalColumns: value });
  };

  const setMergePlacement = (value: GridMergePlacement) => {
    onStateChange({ mergePlacement: value });
  };
  
  const setExtractMethod = (value: GridExtractMethod) => {
    onStateChange({ extractMethod: value });
  };

  const setExtractType = (value: GridExtractType) => {
    onStateChange({ extractType: value });
  };

  const setExtractStartAfter = (value: string) => {
    onStateChange({ extractStartAfter: value });
  };

  const setExtractEndBefore = (value: string) => {
    onStateChange({ extractEndBefore: value });
  };

  const setExtractKeepOriginalColumn = (value: boolean) => {
    onStateChange({ extractKeepOriginalColumn: value });
  };

  const setExtractPlacement = (value: GridExtractPlacement) => {
    onStateChange({ extractPlacement: value });
  };

  const setSingleSelectedColumn = (columnId: string) => {
    onStateChange({ selectedColumnIds: columnId ? [columnId] : [] });
  };

  const renderSharedScope = () => (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Scope</h3>
        <p className="text-sm text-secondary">Choose where this action should run.</p>
      </div>
      <div className="space-y-2 rounded-xl border bg-card p-3">
        {[
          { value: 'all', label: 'All rows' },
          { value: 'filtered', label: 'Filtered rows' },
          { value: 'selected', label: 'Selected rows' },
        ].map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
            <input
              type="radio"
              name={`grid-action-scope-${action.id}`}
              checked={scope === option.value}
              onChange={() => setScope(option.value as GridDataOperationState['scope'])}
              className="h-4 w-4 text-primary"
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        ))}
      </div>
    </section>
  );

  const renderGenericPanel = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      <ColumnSelectionSection
        columns={columns}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={toggleColumn}
        onToggleAllColumns={toggleAllColumns}
      />
      {renderSharedScope()}
      <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-secondary">
        Action: <span className="font-medium text-foreground">{action.label}</span>
        <br />
        Scope: <span className="font-medium text-foreground">{scope}</span>
        <br />
        Columns selected: <span className="font-medium text-foreground">{selectedColumnIds.length}</span>
      </div>
    </div>
  );

  const renderActionPanel = () => {
    switch (action.id) {
      case 'case_normalization':
        return (
          <CaseNormalizationPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            caseFormat={caseFormat}
            onCaseFormatChange={setCaseFormat}
          />
        );
      case 'remove_extra_spaces':
        return (
          <ExtraspacePanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            spaceMode={spaceMode}
            onSpaceModeChange={setSpaceMode}
          />
        );
      case 'find_replace':
        return (
          <FindAndReplacePanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            findText={state.findText}
            onFindTextChange={setFindText}
            replaceText={state.replaceText}
            onReplaceTextChange={setReplaceText}
            matchingCase={matchingCase}
            onMatchingCaseChange={setMatchingCase}
          />
        );
      case 'remove_formatting':
        return (
          <FormattingPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
          onToggleAllColumns={toggleAllColumns}
          formatting={state.formatting}
          onFormattingChange={setFormatting}
          formattingPattern={state.formattingPattern}
          onFormattingPatternChange={setFormattingPattern}
        />
      );
      case 'remove_duplicates':
        return (
          <RemoveDuplicatesPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            duplicateAction={state.duplicateAction}
            onDuplicateActionChange={setDuplicateAction}
            duplicateKeepRule={state.duplicateKeepRule}
            onDuplicateKeepRuleChange={setDuplicateKeepRule}
          />
        );
      case 'fuzzy_deduplication':
        return (
          <FuzzyDuplicationPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            fuzzySensitivity={state.fuzzySensitivity}
            onFuzzySensitivityChange={(val) => onStateChange({ fuzzySensitivity: val })}
            duplicateKeepRule={state.duplicateKeepRule}
            onDuplicateKeepRuleChange={(val) => onStateChange({ duplicateKeepRule: val })}
            duplicateAction={state.duplicateAction === 'remove_duplicates' ? 'remove_duplicates' : 'remove_row'}
            onDuplicateActionChange={(val) => onStateChange({ duplicateAction: val })}
            duplicatesCount={preview ? preview.changedRowIds.length : 0}
            rowsAffected={preview ? preview.affectedRows : 0}
            deduplicationMode={state.deduplicationMode}
            onDeduplicationModeChange={(val) => onStateChange({ deduplicationMode: val })}
          />
        );
      case 'remove_special_characters':
        return (
          <RemoveSpecialCharsPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            charRemovalMode={charRemovalMode}
            onCharRemovalModeChange={setCharRemovalMode}
            customChar={customChar}
            onCustomCharChange={setCustomChar}
          />
        );
      case 'split_column':
        return (
          <SplitColumnPanel
            columns={columns}
            splitSourceColumnId={state.splitSourceColumnId}
            onSplitSourceColumnChange={setSplitSourceColumnId}
            onClearSplitSourceColumn={clearSplitSourceColumn}
            splitMode={state.splitMode}
            onSplitModeChange={setSplitMode}
            splitSeparatorType={state.splitSeparatorType}
            onSplitSeparatorTypeChange={setSplitSeparatorType}
            splitCustomSeparator={state.splitCustomSeparator}
            onSplitCustomSeparatorChange={setSplitCustomSeparator}
            splitMaxColumns={state.splitMaxColumns}
            onSplitMaxColumnsChange={setSplitMaxColumns}
            splitFixedDirection={state.splitFixedDirection}
            onSplitFixedDirectionChange={setSplitFixedDirection}
            splitCharacterCount={state.splitCharacterCount}
            onSplitCharacterCountChange={setSplitCharacterCount}
            splitPattern={state.splitPattern}
            onSplitPatternChange={setSplitPattern}
            splitOutputMode={state.splitOutputMode}
            onSplitOutputModeChange={setSplitOutputMode}
            splitPlacement={state.splitPlacement}
            onSplitPlacementChange={setSplitPlacement}
          />
        );
      case 'merge_column':
        return (
          <MergeColumnPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onToggleColumn={toggleColumn}
            onToggleAllColumns={toggleAllColumns}
            mergeFormat={state.mergeFormat}
            onMergeFormatChange={setMergeFormat}
            mergeCustomSeparator={state.mergeCustomSeparator}
            onMergeCustomSeparatorChange={setMergeCustomSeparator}
            mergeColumnTitle={state.mergeColumnTitle}
            onMergeColumnTitleChange={setMergeColumnTitle}
            mergeKeepOriginalColumns={state.mergeKeepOriginalColumns}
            onMergeKeepOriginalColumnsChange={setMergeKeepOriginalColumns}
            mergePlacement={state.mergePlacement}
            onMergePlacementChange={setMergePlacement}
          />
        );
      case 'extract_substring':
        return (
          <ExtractSubstringPanel
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onSelectColumn={setSingleSelectedColumn}
            method={state.extractMethod}
            onMethodChange={setExtractMethod}
            extractionType={state.extractType}
            onExtractionTypeChange={setExtractType}
            startAfter={state.extractStartAfter}
            onStartAfterChange={setExtractStartAfter}
            endBefore={state.extractEndBefore}
            onEndBeforeChange={setExtractEndBefore}
            keepOriginalColumn={state.extractKeepOriginalColumn}
            onKeepOriginalColumnChange={setExtractKeepOriginalColumn}
            placement={state.extractPlacement}
            onPlacementChange={setExtractPlacement}
          />
        );
      default:
        return renderGenericPanel();
    }
  };

  return renderActionPanel();
};
