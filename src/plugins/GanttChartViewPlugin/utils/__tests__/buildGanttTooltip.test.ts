import { describe, it, expect } from 'vitest';
import { buildGanttTooltipLines } from '../buildGanttTooltip';

const baseOptions = {
  formatTime: (time: string) => `formatted-${time}`,
  fieldConfig: [],
  fieldsToExclude: [],
};

const baseTask = {
  id: 'task-1',
  name: 'Task Alpha',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-05T00:00:00.000Z'),
  rawData: {},
};

const currencyColumn = {
  id: 'currency',
  column_name: 'budget',
  uidt: 'Currency',
  meta: { currencyType: 'USD', currencyLocale: 'en-US' },
};

const percentColumn = {
  id: 'percent',
  column_name: 'progress',
  uidt: 'Percent',
};

describe('buildGanttTooltipLines', () => {
  it('returns an empty array when task is missing', () => {
    const lines = buildGanttTooltipLines({ task: null, columns: [], options: baseOptions });

    expect(lines).toEqual([]);
  });

  it('creates a header line with date range and duration', () => {
    const lines = buildGanttTooltipLines({ task: baseTask, columns: [], options: baseOptions });

    expect(lines[0]).toContain('Task Alpha');
    expect(lines[0]).toContain('days');
  });

  it('omits fields that are hidden via field configuration', () => {
    const options = {
      ...baseOptions,
      fieldConfig: [{ id: 'notes', isHidden: true }],
    };
    const columns = [{ id: 'notes', column_name: 'notes', uidt: 'text' }];
    const task = {
      ...baseTask,
      rawData: { notes: 'Confidential' },
    };

    const lines = buildGanttTooltipLines({ task, columns, options });

    expect(lines).toHaveLength(1);
  });

  it('formats numeric values such as currency and percent', () => {
    const task = {
      ...baseTask,
      rawData: {
        budget: 1000,
        progress: 45,
      },
    };
    const lines = buildGanttTooltipLines({
      task,
      columns: [currencyColumn, percentColumn],
      options: baseOptions,
    });

    expect(lines[1]).toContain('$1,000.00');
    expect(lines[1]).toContain('45%');
  });

  it('uses hyphen placeholders for unsupported values', () => {
    const task = {
      ...baseTask,
      rawData: { complex: { value: true } },
    };
    const columns = [{ id: 'complex', column_name: 'complex', uidt: 'text' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });

    expect(lines[1]).toContain('-');
  });

  it('respects fieldsToExclude when building tooltip rows', () => {
    const options = {
      ...baseOptions,
      fieldsToExclude: ['number'],
    };
    const columns = [{ id: 'score', column_name: 'score', uidt: 'number' }];
    const task = {
      ...baseTask,
      rawData: { score: 99 },
    };

    const lines = buildGanttTooltipLines({ task, columns, options });

    expect(lines).toHaveLength(1);
  });
});
