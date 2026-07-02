import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../shared/ColumnSelectionSection', () => ({
  ColumnSelectionSection: (props: any) => (
    <div
      data-testid="col-select"
      data-columns={JSON.stringify(props.columns)}
      data-selected-column-ids={Array.isArray(props.selectedColumnIds) ? props.selectedColumnIds.join(',') : ''}
      data-title={props.title}
      data-description={props.description}
    />
  ),
}));

import { CaseNormalizationPanel } from '../CaseNormalizationPanel';

describe('CaseNormalizationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ColumnSelectionSection with provided props and panel headings', () => {
    const columns = [{ id: 'c1', title: 'Column 1' }];
    const selectedColumnIds: string[] = ['c1'];
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    render(
      <CaseNormalizationPanel
        columns={columns as any}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat="lowercase"
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect).toBeInTheDocument();
    expect(colSelect.getAttribute('data-columns')).toBe(JSON.stringify(columns));
    expect(colSelect.getAttribute('data-selected-column-ids')).toBe('c1');
    expect(colSelect.getAttribute('data-title')).toBe('Select columns');
    expect(colSelect.getAttribute('data-description')).toBe('Choose the columns to normalize.');

    expect(screen.getByText('Case format')).toBeInTheDocument();
    expect(screen.getByText('Choose how text should be formatted.')).toBeInTheDocument();
  });

  it('renders all case format radio options and marks the selected one as checked', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    render(
      <CaseNormalizationPanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat="uppercase"
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);

    const uppercaseRadio = screen.getByRole('radio', { name: /UPPERCASE/i });
    expect(uppercaseRadio).toBeInstanceOf(HTMLInputElement);
    expect((uppercaseRadio as HTMLInputElement).checked).toBe(true);
  });

  it('calls onCaseFormatChange with correct value when a radio option is selected', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    render(
      <CaseNormalizationPanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat="lowercase"
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const titleCaseRadio = screen.getByRole('radio', { name: /Title Case/i });
    fireEvent.click(titleCaseRadio);

    expect(onCaseFormatChange).toHaveBeenCalledTimes(1);
    expect(onCaseFormatChange).toHaveBeenCalledWith('title_case');
  });

  it('applies border-b to all options except the last one', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    const { container } = render(
      <CaseNormalizationPanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat="lowercase"
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const labels = Array.from(container.querySelectorAll('label[aria-label]'));
    expect(labels.length).toBeGreaterThanOrEqual(4);

    const lastLabel = labels[labels.length - 1];
    expect(lastLabel.className).not.toMatch(/border-b/);

    const nonLastLabels = labels.slice(0, labels.length - 1);
    nonLastLabels.forEach((lbl) => expect(lbl.className).toMatch(/border-b/));
  });

  it('renders correctly when columns list is empty', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    render(
      <CaseNormalizationPanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat="sentence_case"
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect.getAttribute('data-columns')).toBe('[]');
    expect(colSelect.getAttribute('data-selected-column-ids')).toBe('');

    const sentenceRadio = screen.getByRole('radio', { name: /Sentence case/i });
    expect((sentenceRadio as HTMLInputElement).checked).toBe(true);
  });

  it('does not mark any radio checked when caseFormat is unknown', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onCaseFormatChange = vi.fn();

    render(
      <CaseNormalizationPanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        caseFormat={'unknown' as any}
        onCaseFormatChange={onCaseFormatChange}
      />
    );

    const radios = screen.getAllByRole('radio');
    const anyChecked = radios.some((r) => (r as HTMLInputElement).checked);
    expect(anyChecked).toBe(false);
  });
});
