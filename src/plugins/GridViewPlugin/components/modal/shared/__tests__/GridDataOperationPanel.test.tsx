import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { GridActionDefinition } from '../../../toolbar/gridActionCatalog';
import type {
  GridCaseFormat,
  GridCharRemovalMode,
  GridDataOperationState,
  GridDuplicateAction,
  GridDuplicateKeepRule,
  GridExtractMethod,
  GridExtractPlacement,
  GridExtractType,
  GridFindReplaceMatchMode,
  GridFormattingMode,
  GridMergeFormat,
  GridMergePlacement,
  GridSpaceMode,
  GridSplitFixedDirection,
  GridSplitMode,
  GridSplitOutputMode,
  GridSplitPlacement,
  GridSplitSeparatorType,
} from '../gridDataOperation.types';
import type { GridColumn } from '../../../../types/grid.types';

const { casePanelSpy, extraspacePanelSpy, findReplacePanelSpy, removeFormattingPanelSpy, removeDuplicatesPanelSpy, removeSpecialCharsPanelSpy, splitPanelSpy, mergePanelSpy, extractPanelSpy } =
  vi.hoisted(() => ({
    casePanelSpy: vi.fn(),
    extraspacePanelSpy: vi.fn(),
    findReplacePanelSpy: vi.fn(),
    removeFormattingPanelSpy: vi.fn(),
    removeDuplicatesPanelSpy: vi.fn(),
    removeSpecialCharsPanelSpy: vi.fn(),
    splitPanelSpy: vi.fn(),
    mergePanelSpy: vi.fn(),
    extractPanelSpy: vi.fn(),
  }));

interface CaseNormalizationPanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  caseFormat: GridCaseFormat;
  onCaseFormatChange: (value: GridCaseFormat) => void;
}

interface ExtraspacePanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  spaceMode: GridSpaceMode;
  onSpaceModeChange: (value: GridSpaceMode) => void;
}

interface FindAndReplacePanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  findText: string;
  onFindTextChange: (value: string) => void;
  replaceText: string;
  onReplaceTextChange: (value: string) => void;
  matchingCase: GridFindReplaceMatchMode;
  onMatchingCaseChange: (value: GridFindReplaceMatchMode) => void;
}

interface FormattingPanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  formatting: GridFormattingMode;
  onFormattingChange: (value: GridFormattingMode) => void;
  formattingPattern: string;
  onFormattingPatternChange: (value: string) => void;
}

interface RemoveDuplicatesPanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  duplicateAction: GridDuplicateAction;
  onDuplicateActionChange: (value: GridDuplicateAction) => void;
  duplicateKeepRule: GridDuplicateKeepRule;
  onDuplicateKeepRuleChange: (value: GridDuplicateKeepRule) => void;
}

interface RemoveSpecialCharsPanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  charRemovalMode: GridCharRemovalMode;
  onCharRemovalModeChange: (value: GridCharRemovalMode) => void;
  customChar: string;
  onCustomCharChange: (value: string) => void;
}

interface SplitColumnPanelMockProps {
  columns: GridColumn[];
  splitSourceColumnId: string;
  onSplitSourceColumnChange: (value: string) => void;
  onClearSplitSourceColumn: () => void;
  splitMode: GridSplitMode;
  onSplitModeChange: (value: GridSplitMode) => void;
  splitSeparatorType: GridSplitSeparatorType;
  onSplitSeparatorTypeChange: (value: GridSplitSeparatorType) => void;
  splitCustomSeparator: string;
  onSplitCustomSeparatorChange: (value: string) => void;
  splitMaxColumns: string;
  onSplitMaxColumnsChange: (value: string) => void;
  splitFixedDirection: GridSplitFixedDirection;
  onSplitFixedDirectionChange: (value: GridSplitFixedDirection) => void;
  splitCharacterCount: string;
  onSplitCharacterCountChange: (value: string) => void;
  splitPattern: string;
  onSplitPatternChange: (value: string) => void;
  splitOutputMode: GridSplitOutputMode;
  onSplitOutputModeChange: (value: GridSplitOutputMode) => void;
  splitPlacement: GridSplitPlacement;
  onSplitPlacementChange: (value: GridSplitPlacement) => void;
}

interface MergeColumnPanelMockProps {
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

interface ExtractSubstringPanelMockProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onSelectColumn: (columnId: string) => void;
  method: GridExtractMethod;
  onMethodChange: (value: GridExtractMethod) => void;
  extractionType: GridExtractType;
  onExtractionTypeChange: (value: GridExtractType) => void;
  startAfter: string;
  onStartAfterChange: (value: string) => void;
  endBefore: string;
  onEndBeforeChange: (value: string) => void;
  keepOriginalColumn: boolean;
  onKeepOriginalColumnChange: (value: boolean) => void;
  placement: GridExtractPlacement;
  onPlacementChange: (value: GridExtractPlacement) => void;
}

vi.mock('../../panels/CaseNormalizationPanel', () => ({
  CaseNormalizationPanel: (props: unknown) => {
    casePanelSpy(props);
    const panelProps = props as CaseNormalizationPanelMockProps;

    return (
      <div data-testid="case-normalization-panel" data-case-format={panelProps.caseFormat}>
        <button type="button" onClick={() => panelProps.onCaseFormatChange('uppercase')}>
          Uppercase
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/ExtraspacePanel', () => ({
  ExtraspacePanel: (props: unknown) => {
    extraspacePanelSpy(props);
    const panelProps = props as ExtraspacePanelMockProps;

    return (
      <div data-testid="extraspace-panel" data-space-mode={panelProps.spaceMode}>
        <button type="button" onClick={() => panelProps.onSpaceModeChange('leading')}>
          Leading
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/FindAndReplacePanel', () => ({
  FindAndReplacePanel: (props: unknown) => {
    findReplacePanelSpy(props);
    const panelProps = props as FindAndReplacePanelMockProps;

    return (
      <div
        data-testid="find-replace-panel"
        data-find-text={panelProps.findText}
        data-replace-text={panelProps.replaceText}
        data-matching-case={panelProps.matchingCase}
      >
        <input
          aria-label="Find text"
          value={panelProps.findText}
          onChange={(event) => panelProps.onFindTextChange(event.target.value)}
        />
        <input
          aria-label="Replace text"
          value={panelProps.replaceText}
          onChange={(event) => panelProps.onReplaceTextChange(event.target.value)}
        />
        <button type="button" onClick={() => panelProps.onMatchingCaseChange('match_entire_value')}>
          Match entire value
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/RemoveFormatting', () => ({
  FormattingPanel: (props: unknown) => {
    removeFormattingPanelSpy(props);
    const panelProps = props as FormattingPanelMockProps;

    return (
      <div data-testid="remove-formatting-panel" data-formatting={panelProps.formatting} data-pattern={panelProps.formattingPattern}>
        <button type="button" onClick={() => panelProps.onFormattingChange('custom')}>
          Custom formatting
        </button>
        <input
          aria-label="Formatting pattern"
          value={panelProps.formattingPattern}
          onChange={(event) => panelProps.onFormattingPatternChange(event.target.value)}
        />
      </div>
    );
  },
}));

vi.mock('../../panels/RemoveDuplicatesPanel', () => ({
  RemoveDuplicatesPanel: (props: unknown) => {
    removeDuplicatesPanelSpy(props);
    const panelProps = props as RemoveDuplicatesPanelMockProps;

    return (
      <div
        data-testid="remove-duplicates-panel"
        data-duplicate-action={panelProps.duplicateAction}
        data-duplicate-keep-rule={panelProps.duplicateKeepRule}
      >
        <button type="button" onClick={() => panelProps.onDuplicateActionChange('remove_duplicates')}>
          Remove duplicates
        </button>
        <button type="button" onClick={() => panelProps.onDuplicateKeepRuleChange('keep_latest_updated')}>
          Keep latest updated
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/RemoveSpecialCharsPanel', () => ({
  RemoveSpecialCharsPanel: (props: unknown) => {
    removeSpecialCharsPanelSpy(props);
    const panelProps = props as RemoveSpecialCharsPanelMockProps;

    return (
      <div
        data-testid="remove-special-chars-panel"
        data-char-removal-mode={panelProps.charRemovalMode}
        data-custom-char={panelProps.customChar}
      >
        <button type="button" onClick={() => panelProps.onCharRemovalModeChange('custom')}>
          Custom characters
        </button>
        <input
          aria-label="Custom character"
          value={panelProps.customChar}
          onChange={(event) => panelProps.onCustomCharChange(event.target.value)}
        />
      </div>
    );
  },
}));

vi.mock('../../panels/SplitColumnPanel', () => ({
  SplitColumnPanel: (props: unknown) => {
    splitPanelSpy(props);
    const panelProps = props as SplitColumnPanelMockProps;

    return (
      <div
        data-testid="split-column-panel"
        data-split-source-column-id={panelProps.splitSourceColumnId}
        data-split-mode={panelProps.splitMode}
        data-split-separator-type={panelProps.splitSeparatorType}
        data-split-custom-separator={panelProps.splitCustomSeparator}
        data-split-max-columns={panelProps.splitMaxColumns}
        data-split-fixed-direction={panelProps.splitFixedDirection}
        data-split-character-count={panelProps.splitCharacterCount}
        data-split-pattern={panelProps.splitPattern}
        data-split-output-mode={panelProps.splitOutputMode}
        data-split-placement={panelProps.splitPlacement}
      >
        <button type="button" onClick={() => panelProps.onSplitSourceColumnChange('first_name')}>
          Select source column
        </button>
        <button type="button" onClick={panelProps.onClearSplitSourceColumn}>
          Clear source column
        </button>
        <button type="button" onClick={() => panelProps.onSplitModeChange('pattern')}>
          Pattern mode
        </button>
        <button type="button" onClick={() => panelProps.onSplitSeparatorTypeChange('custom')}>
          Custom separator type
        </button>
        <input
          aria-label="Split custom separator"
          value={panelProps.splitCustomSeparator}
          onChange={(event) => panelProps.onSplitCustomSeparatorChange(event.target.value)}
        />
        <input
          aria-label="Split max columns"
          value={panelProps.splitMaxColumns}
          onChange={(event) => panelProps.onSplitMaxColumnsChange(event.target.value)}
        />
        <button type="button" onClick={() => panelProps.onSplitFixedDirectionChange('before')}>
          Before
        </button>
        <input
          aria-label="Split character count"
          value={panelProps.splitCharacterCount}
          onChange={(event) => panelProps.onSplitCharacterCountChange(event.target.value)}
        />
        <input
          aria-label="Split pattern"
          value={panelProps.splitPattern}
          onChange={(event) => panelProps.onSplitPatternChange(event.target.value)}
        />
        <button type="button" onClick={() => panelProps.onSplitOutputModeChange('replace_original')}>
          Replace original
        </button>
        <button type="button" onClick={() => panelProps.onSplitPlacementChange('end_of_table')}>
          End of table
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/MergeColumnPanel', () => ({
  MergeColumnPanel: (props: unknown) => {
    mergePanelSpy(props);
    const panelProps = props as MergeColumnPanelMockProps;

    return (
      <div
        data-testid="merge-column-panel"
        data-merge-format={panelProps.mergeFormat}
        data-merge-column-title={panelProps.mergeColumnTitle}
        data-merge-keep-original-columns={String(panelProps.mergeKeepOriginalColumns)}
        data-merge-placement={panelProps.mergePlacement}
      >
        <button type="button" onClick={() => panelProps.onToggleColumn('first_name')}>
          Toggle first column
        </button>
        <button type="button" onClick={() => panelProps.onToggleColumn('last_name')}>
          Toggle second column
        </button>
        <button type="button" onClick={() => panelProps.onMergeFormatChange('custom')}>
          Custom merge format
        </button>
        <input
          aria-label="Merge custom separator"
          value={panelProps.mergeCustomSeparator}
          onChange={(event) => panelProps.onMergeCustomSeparatorChange(event.target.value)}
        />
        <input
          aria-label="Merge column title"
          value={panelProps.mergeColumnTitle}
          onChange={(event) => panelProps.onMergeColumnTitleChange(event.target.value)}
        />
        <label>
          <input
            type="checkbox"
            aria-label="Keep original columns"
            checked={panelProps.mergeKeepOriginalColumns}
            onChange={(event) => panelProps.onMergeKeepOriginalColumnsChange(event.target.checked)}
          />
          Keep original columns
        </label>
        <button type="button" onClick={() => panelProps.onMergePlacementChange('end_of_table')}>
          End of table
        </button>
      </div>
    );
  },
}));

vi.mock('../../panels/ExtractSubstring', () => ({
  ExtractSubstringPanel: (props: unknown) => {
    extractPanelSpy(props);
    const panelProps = props as ExtractSubstringPanelMockProps;

    return (
      <div
        data-testid="extract-substring-panel"
        data-method={panelProps.method}
        data-extraction-type={panelProps.extractionType}
        data-start-after={panelProps.startAfter}
        data-end-before={panelProps.endBefore}
        data-keep-original-column={String(panelProps.keepOriginalColumn)}
        data-placement={panelProps.placement}
      >
        <button type="button" onClick={() => panelProps.onSelectColumn('first_name')}>
          Select source column
        </button>
        <button type="button" onClick={() => panelProps.onMethodChange('between_characters')}>
          Between characters
        </button>
        <button type="button" onClick={() => panelProps.onExtractionTypeChange('phone')}>
          Phone
        </button>
        <input
          aria-label="Start after"
          value={panelProps.startAfter}
          onChange={(event) => panelProps.onStartAfterChange(event.target.value)}
        />
        <input
          aria-label="End before"
          value={panelProps.endBefore}
          onChange={(event) => panelProps.onEndBeforeChange(event.target.value)}
        />
        <label>
          <input
            type="checkbox"
            aria-label="Keep original column"
            checked={panelProps.keepOriginalColumn}
            onChange={(event) => panelProps.onKeepOriginalColumnChange(event.target.checked)}
          />
          Keep original column
        </label>
        <button type="button" onClick={() => panelProps.onPlacementChange('end_of_table')}>
          End of table
        </button>
      </div>
    );
  },
}));

import { GridDataOperationPanel } from '../GridDataOperationPanel';

type GridDataOperationPanelProps = ComponentProps<typeof GridDataOperationPanel>;
type PanelState = GridDataOperationPanelProps['state'];
type PanelAction = GridDataOperationPanelProps['action'];

const standardColumns: GridColumn[] = [
  { id: 'first_name', title: 'First Name', type: 'text' },
  { key: 'last_name', title: 'Last Name', type: 'text' },
  { column_name: 'email_address', title: 'Email Address', type: 'text' },
  { type: 'text' } as unknown as GridColumn,
];

const mergeColumns: GridColumn[] = [
  { id: 'first_name', title: 'First Name', type: 'text' },
  { id: 'last_name', title: '', column_name: 'Last Name', type: 'text' },
];

const createState = (overrides: Partial<PanelState> = {}): PanelState => ({
  scope: 'all',
  selectedColumnIds: [],
  caseFormat: 'lowercase',
  spaceMode: 'both',
  formatting: 'currency',
  formattingPattern: '',
  findText: '',
  replaceText: '',
  matchingCase: 'match_case',
  duplicateAction: 'remove_row',
  duplicateKeepRule: 'keep_first',
  splitSourceColumnId: '',
  splitMode: 'separator',
  splitSeparatorType: 'space',
  splitCustomSeparator: '',
  splitMaxColumns: '2',
  splitFixedDirection: 'after',
  splitCharacterCount: '2',
  splitPattern: '',
  splitOutputMode: 'keep_original',
  splitPlacement: 'next_to_original',
  mergeFormat: 'space',
  mergeCustomSeparator: '',
  mergeColumnTitle: '',
  mergeKeepOriginalColumns: false,
  mergePlacement: 'next_to_original',
  charRemovalMode: 'symbols',
  customChar: '',
  extractMethod: 'extraction_type',
  extractType: 'email',
  extractStartAfter: '',
  extractEndBefore: '',
  extractKeepOriginalColumn: false,
  extractPlacement: 'next_to_original',
  ...overrides,
});

const createAction = (overrides: Partial<PanelAction> = {}): PanelAction => ({
  id: 'case_normalization',
  group: 'clean',
  label: 'Case Normalization',
  description: 'Convert text to consistent case.',
  icon: () => null,
  ...overrides,
});

const renderPanel = (options: {
  action?: PanelAction;
  columns?: GridColumn[];
  state?: Partial<PanelState>;
}) => {
  const onStateChange = vi.fn();

  render(
    <GridDataOperationPanel
      action={options.action ?? createAction()}
      columns={options.columns ?? standardColumns}
      state={createState(options.state)}
      onStateChange={onStateChange}
    />
  );

  return { onStateChange };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GridDataOperationPanel', () => {
  it('renders the generic panel for an unsupported action id', () => {
    renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
    });

    expect(screen.getByText('Custom action')).toBeInTheDocument();
    expect(screen.getByText('Choose where this action should run.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'All rows' })).toBeChecked();
  });

  it('selects every selectable column on the generic panel when select all is enabled', () => {
    const { onStateChange } = renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
      columns: standardColumns,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onStateChange).toHaveBeenCalledWith({
      selectedColumnIds: ['first_name', 'last_name', 'email_address'],
    });
  });

  it('clears the generic panel select all state when every selectable column is already selected', () => {
    const { onStateChange } = renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
      columns: standardColumns,
      state: { selectedColumnIds: ['first_name', 'last_name', 'email_address'] },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onStateChange).toHaveBeenCalledWith({ selectedColumnIds: [] });
  });

  it('toggles a selectable column on the generic panel', () => {
    const { onStateChange } = renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
      columns: standardColumns,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'First Name' }));

    expect(onStateChange).toHaveBeenCalledWith({ selectedColumnIds: ['first_name'] });
  });

  it('toggles a selected column off on the generic panel', () => {
    const { onStateChange } = renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
      columns: standardColumns,
      state: { selectedColumnIds: ['first_name'] },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'First Name' }));

    expect(onStateChange).toHaveBeenCalledWith({ selectedColumnIds: [] });
  });

  it('updates the shared scope when a scope option is selected', () => {
    const { onStateChange } = renderPanel({
      action: {
        id: 'unsupported_action' as GridActionDefinition['id'],
        group: 'clean',
        label: 'Custom action',
        description: 'Unsupported action.',
        icon: () => null,
      },
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Filtered rows' }));

    expect(onStateChange).toHaveBeenCalledWith({ scope: 'filtered' });
  });

  it('suggests a merged column title when the second merge column is selected', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'merge_column', label: 'Merge Column' }),
      columns: mergeColumns,
      state: { selectedColumnIds: ['first_name'], mergeColumnTitle: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle second column' }));

    expect(onStateChange).toHaveBeenCalledWith({
      selectedColumnIds: ['first_name', 'last_name'],
      mergeColumnTitle: 'First Name Last Name',
    });
  });

  it('preserves an existing merge column title when a second column is added', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'merge_column', label: 'Merge Column' }),
      columns: mergeColumns,
      state: { selectedColumnIds: ['first_name'], mergeColumnTitle: 'Custom Title' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle second column' }));

    expect(onStateChange).toHaveBeenCalledWith({ selectedColumnIds: ['first_name', 'last_name'] });
  });

  it('clears the merge column title when the last selected merge column is removed', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'merge_column', label: 'Merge Column' }),
      columns: mergeColumns,
      state: { selectedColumnIds: ['first_name'], mergeColumnTitle: 'Custom Title' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle first column' }));

    expect(onStateChange).toHaveBeenCalledWith({
      selectedColumnIds: [],
      mergeColumnTitle: '',
    });
  });

  it('keeps the merge column title when the selection shrinks to one column', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'merge_column', label: 'Merge Column' }),
      columns: mergeColumns,
      state: {
        selectedColumnIds: ['first_name', 'last_name'],
        mergeColumnTitle: 'Custom Title',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle second column' }));

    expect(onStateChange).toHaveBeenCalledWith({
      selectedColumnIds: ['first_name'],
      mergeColumnTitle: 'Custom Title',
    });
  });

  it('forwards merge settings updates from the merge panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'merge_column', label: 'Merge Column' }),
      columns: mergeColumns,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Custom merge format' }));
    fireEvent.change(screen.getByLabelText('Merge custom separator'), { target: { value: ' :: ' } });
    fireEvent.change(screen.getByLabelText('Merge column title'), { target: { value: 'Display Name' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep original columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'End of table' }));

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { mergeFormat: 'custom' },
      { mergeCustomSeparator: ' :: ' },
      { mergeColumnTitle: 'Display Name' },
      { mergeKeepOriginalColumns: true },
      { mergePlacement: 'end_of_table' },
    ]);
  });

  it('forwards case normalization updates from the case panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'case_normalization', label: 'Case Normalization' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Uppercase' }));

    expect(onStateChange).toHaveBeenCalledWith({ caseFormat: 'uppercase' });
  });

  it('forwards extra space cleanup updates from the extraspace panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'remove_extra_spaces', label: 'Remove Extra Spaces' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Leading' }));

    expect(onStateChange).toHaveBeenCalledWith({ spaceMode: 'leading' });
  });

  it('forwards find and replace updates from the find and replace panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'find_replace', label: 'Find & Replace' }),
    });

    fireEvent.change(screen.getByLabelText('Find text'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('Replace text'), { target: { value: 'New York' } });
    fireEvent.click(screen.getByRole('button', { name: 'Match entire value' }));

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { findText: 'NY' },
      { replaceText: 'New York' },
      { matchingCase: 'match_entire_value' },
    ]);
  });

  it('forwards remove formatting updates from the formatting panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'remove_formatting', label: 'Remove Formatting' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Custom formatting' }));
    fireEvent.change(screen.getByLabelText('Formatting pattern'), { target: { value: '#,##0.00' } });

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { formatting: 'custom' },
      { formattingPattern: '#,##0.00' },
    ]);
  });

  it('forwards duplicate removal updates from the duplicates panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'remove_duplicates', label: 'Remove Duplicates' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove duplicates' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep latest updated' }));

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { duplicateAction: 'remove_duplicates' },
      { duplicateKeepRule: 'keep_latest_updated' },
    ]);
  });

  it('forwards special character removal updates from the special characters panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'remove_special_characters', label: 'Remove Special Characters' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Custom characters' }));
    fireEvent.change(screen.getByLabelText('Custom character'), { target: { value: '@#$' } });

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { charRemovalMode: 'custom' },
      { customChar: '@#$' },
    ]);
  });

  it('forwards split column updates from the split panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'split_column', label: 'Split Column' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select source column' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear source column' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pattern mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Custom separator type' }));
    fireEvent.change(screen.getByLabelText('Split custom separator'), { target: { value: ' | ' } });
    fireEvent.change(screen.getByLabelText('Split max columns'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Before' }));
    fireEvent.change(screen.getByLabelText('Split character count'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Split pattern'), { target: { value: '\\d+' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace original' }));
    fireEvent.click(screen.getByRole('button', { name: 'End of table' }));

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { splitSourceColumnId: 'first_name', selectedColumnIds: ['first_name'] },
      { splitSourceColumnId: '', selectedColumnIds: [] },
      { splitMode: 'pattern' },
      { splitSeparatorType: 'custom' },
      { splitCustomSeparator: ' | ' },
      { splitMaxColumns: '4' },
      { splitFixedDirection: 'before' },
      { splitCharacterCount: '5' },
      { splitPattern: '\\d+' },
      { splitOutputMode: 'replace_original' },
      { splitPlacement: 'end_of_table' },
    ]);
  });

  it('forwards extract substring updates from the extract panel', () => {
    const { onStateChange } = renderPanel({
      action: createAction({ id: 'extract_substring', label: 'Extract Substring' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select source column' }));
    fireEvent.click(screen.getByRole('button', { name: 'Between characters' }));
    fireEvent.click(screen.getByRole('button', { name: 'Phone' }));
    fireEvent.change(screen.getByLabelText('Start after'), { target: { value: 'start' } });
    fireEvent.change(screen.getByLabelText('End before'), { target: { value: 'end' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep original column' }));
    fireEvent.click(screen.getByRole('button', { name: 'End of table' }));

    expect(onStateChange.mock.calls.map(([patch]) => patch)).toEqual([
      { selectedColumnIds: ['first_name'] },
      { extractMethod: 'between_characters' },
      { extractType: 'phone' },
      { extractStartAfter: 'start' },
      { extractEndBefore: 'end' },
      { extractKeepOriginalColumn: true },
      { extractPlacement: 'end_of_table' },
    ]);
  });
});
