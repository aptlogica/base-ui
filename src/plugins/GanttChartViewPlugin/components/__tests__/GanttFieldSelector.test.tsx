import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GanttFieldSelector, GanttFieldConfiguration } from '../GanttFieldSelector';
import type { Column } from '../../../../types/api.types';

const advancedDropdownSpy = vi.fn();

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: (props: any) => {
    advancedDropdownSpy(props);
    return <div data-testid={props.label || 'advanced-dropdown'} />;
  },
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn(() => 'Icon'),
  getRelationTypeFromField: vi.fn(() => undefined),
}));

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: () => ({
    position: { top: 10, left: 10 },
  }),
}));

const buildColumn = (overrides: Partial<Column>): Column => ({
  id: String(overrides.id || 'col'),
  column_name: overrides.column_name || 'col',
  title: overrides.title || 'Column',
  uidt: overrides.uidt || 'text',
  model_id: 'model',
  base_id: 'base',
  dt: 'text',
  description: '',
  meta: {},
  virtual: false,
  system: false,
  deleted: false,
  order_index: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
});

describe('GanttFieldSelector', () => {
  beforeEach(() => {
    advancedDropdownSpy.mockClear();
  });

  it('filters date fields when selecting date type', () => {
    const dateColumn = buildColumn({ id: 'date', uidt: 'date', title: 'Start' });
    const numberColumn = buildColumn({ id: 'num', uidt: 'number', title: 'Qty' });

    render(
      <GanttFieldSelector
        label="Start"
        iconComponent={() => <span />}
        items={[dateColumn, numberColumn]}
        onChange={() => undefined}
        fieldType="date"
      />
    );

    const options = advancedDropdownSpy.mock.calls[0][0].options;

    expect(options).toHaveLength(1);
    expect(options[0].value).toBe('date');
  });

  it('calls onChange with the matched progress column', () => {
    const progressColumn = buildColumn({ id: 'progress', uidt: 'number', column_name: 'task_progress', title: 'Task Progress' });

    const handleChange = vi.fn();

    render(
      <GanttFieldSelector
        label="Progress"
        iconComponent={() => <span />}
        items={[progressColumn]}
        onChange={handleChange}
        fieldType="progress"
      />
    );

    const dropdownProps = advancedDropdownSpy.mock.calls[0][0];
    dropdownProps.onChange('progress');

    expect(handleChange).toHaveBeenCalledWith(progressColumn);
  });

  it('includes completion candidates based on keywords', () => {
    const dateColumn = buildColumn({ id: 'end', uidt: 'date', title: 'End' });
    const doneColumn = buildColumn({ id: 'done', uidt: 'text', title: 'Done Date' });

    render(
      <GanttFieldSelector
        label="Completion"
        iconComponent={() => <span />}
        items={[dateColumn, doneColumn]}
        onChange={() => undefined}
        fieldType="completion"
      />
    );

    const options = advancedDropdownSpy.mock.calls[0][0].options;

    expect(options).toHaveLength(2);
    expect(options[0].value).toBe('end');
    expect(options[1].value).toBe('done');
  });
});

describe('GanttFieldConfiguration', () => {
  beforeEach(() => {
    advancedDropdownSpy.mockClear();
  });

  it('returns null when handlers are missing', () => {
    render(
      <GanttFieldConfiguration
        columns={[buildColumn({ uidt: 'date', id: 'start' })]}
        startDateField={undefined}
        endDateField={undefined}
      />
    );

    expect(screen.queryByRole('button', { name: 'Gantt Fields' })).toBeNull();
  });

  it('opens the configuration panel and handles all dropdown changes', async () => {
    const columns = [
      buildColumn({ id: 'start', uidt: 'date', title: 'Start' }),
      buildColumn({ id: 'end', uidt: 'date', title: 'End' }),
      buildColumn({ id: 'progress', uidt: 'percent', title: 'Progress' }),
      buildColumn({ id: 'complete', uidt: 'text', title: 'Completed' }),
    ];
    const handleStart = vi.fn();
    const handleEnd = vi.fn();
    const handleProgress = vi.fn();
    const handleCompletion = vi.fn();

    render(
      <GanttFieldConfiguration
        columns={columns}
        onStartDateFieldChange={handleStart}
        onEndDateFieldChange={handleEnd}
        onProgressFieldChange={handleProgress}
        onCompletionFieldChange={handleCompletion}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Gantt Fields' });
    await userEvent.click(toggleButton);

    const startDropdown = advancedDropdownSpy.mock.calls[0][0];
    const endDropdown = advancedDropdownSpy.mock.calls[1][0];
    const progressDropdown = advancedDropdownSpy.mock.calls[2][0];
    const completionDropdown = advancedDropdownSpy.mock.calls[3][0];

    startDropdown.onChange('start');
    endDropdown.onChange('end');
    progressDropdown.onChange('progress');
    completionDropdown.onChange('complete');

    expect(handleStart).toHaveBeenCalledWith(columns[0]);
    expect(handleEnd).toHaveBeenCalledWith(columns[1]);
    expect(handleProgress).toHaveBeenCalledWith(columns[2]);
    expect(handleCompletion).toHaveBeenCalledWith(columns[3]);
  });
});
