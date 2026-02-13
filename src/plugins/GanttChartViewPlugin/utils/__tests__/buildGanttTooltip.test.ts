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

  it('formats date, datetime and time values', () => {
    const task = {
      ...baseTask,
      rawData: {
        dueDate: '2024-01-08',
        dueAt: '2024-01-08T14:30:00.000Z',
        slot: '09:45',
      },
    };
    const columns = [
      { id: 'd1', column_name: 'dueDate', uidt: 'date' },
      { id: 'd2', column_name: 'dueAt', uidt: 'datetime' },
      { id: 't1', column_name: 'slot', uidt: 'time' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });

    expect(lines[1]).toContain('Jan');
    expect(lines[1]).toContain('formatted-09:45');
  });

  it('formats boolean, decimal and number values', () => {
    const task = {
      ...baseTask,
      rawData: { ok: true, ratio: 2.3456, count: 12000 },
    };
    const columns = [
      { id: 'b', column_name: 'ok', uidt: 'Checkbox' },
      { id: 'd', column_name: 'ratio', uidt: 'Decimal' },
      { id: 'n', column_name: 'count', uidt: 'Number' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines[1]).toContain('Yes');
    expect(lines[1]).toContain('2.35');
    expect(lines[1]).toContain('12,000');
  });

  it('handles multiSelect arrays and JSON-string arrays', () => {
    const task = {
      ...baseTask,
      rawData: {
        tags1: ['A', 'B'],
        tags2: '["X","Y"]',
      },
    };
    const columns = [
      { id: 'm1', column_name: 'tags1', uidt: 'multiselect' },
      { id: 'm2', column_name: 'tags2', uidt: 'multiselect' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines[1]).toContain('A, B');
    expect(lines[1]).toContain('X, Y');
  });

  it('formats arrays of linked objects and generic objects', () => {
    const task = {
      ...baseTask,
      rawData: {
        links: [{ title: 'Rel 1' }, { title: 'Rel 2' }],
        owner: { name: 'Alice' },
      },
    };
    const columns = [
      { id: 'l', column_name: 'links', uidt: 'links' },
      { id: 'o', column_name: 'owner', uidt: 'user' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines[1]).toContain('Rel 1, Rel 2');
    expect(lines[1]).toContain('Alice');
  });

  it('cleans rich text longText HTML content', () => {
    const task = {
      ...baseTask,
      rawData: {
        notes: '<p>Hello&nbsp;<strong>World</strong> <span style="color:red">Text</span></p>',
      },
    };
    const columns = [{ id: 'lt', column_name: 'notes', uidt: 'longText', type: 'longtext' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines[1]).toContain('Hello World Text');
    expect(lines[1]).not.toContain('<');
  });

  it('skips system, id and title columns', () => {
    const task = {
      ...baseTask,
      rawData: { id: '1', title: 'ignored', custom: 'shown' },
    };
    const columns = [
      { id: 'id-col', column_name: 'id', uidt: 'text' },
      { id: 'title-col', column_name: 'title', uidt: 'text' },
      { id: 'sys-col', column_name: 'sys', uidt: 'text', system: true },
      { id: 'custom-col', column_name: 'custom', uidt: 'text' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines[1]).toContain('shown');
    expect(lines.join(' ')).not.toContain('ignored');
  });

  it('groups visible fields into bullet lines and orders by priority', () => {
    const task = {
      ...baseTask,
      rawData: {
        c: 1200,
        p: 55,
        e: 'a@b.com',
        t: 'Plain',
      },
    };
    const columns = [
      { id: 't', column_name: 't', uidt: 'text' },
      { id: 'e', column_name: 'e', uidt: 'Email' },
      { id: 'p', column_name: 'p', uidt: 'Percent' },
      { id: 'c', column_name: 'c', uidt: 'Currency', meta: { currencyType: 'USD', currencyLocale: 'en-US' } },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines.length).toBeGreaterThanOrEqual(3); // title + at least two grouped lines
    expect(lines[1]).toContain('$1,200.00');
    expect(lines[1]).toContain('55%');
    expect(lines[1]).toContain('a@b.com');
  });
});

describe('buildGanttTooltipLines - additional coverage', () => {
  it('returns header only when rawData is missing', () => {
    const task = {
      id: 'task-no-raw',
      name: 'Only Header',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2024-01-02T00:00:00.000Z'),
    };

    const lines = buildGanttTooltipLines({ task, columns: [], options: baseOptions as any });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Only Header');
  });

  it('formats boolean false as No', () => {
    const task = {
      ...baseTask,
      rawData: { ok: false },
    };
    const columns = [{ id: 'b', column_name: 'ok', uidt: 'Checkbox' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines.join(' ')).toContain('No');
  });

  it('falls back to raw time text when format does not match HH:mm', () => {
    const task = {
      ...baseTask,
      rawData: { slot: '9am' },
    };
    const columns = [{ id: 't', column_name: 'slot', uidt: 'time' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines.join(' ')).toContain('9am');
    expect(lines.join(' ')).not.toContain('formatted-9am');
  });

  it('renders hyphen for NaN currency values', () => {
    const task = {
      ...baseTask,
      rawData: { budget: 'not-a-number' },
    };
    const columns = [currencyColumn];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines.join(' ')).toContain('-');
  });
});

describe('buildGanttTooltipLines - richer branch coverage', () => {
  it('cleans longText with css/hex/rgb/unit noise', () => {
    const task = {
      ...baseTask,
      rawData: {
        notes: '<div>Alpha&nbsp;&amp;&quot;Beta&quot; color:red; margin:10px; width:5em; opacity:50%; rgb(1,2,3) #abcdef</div>',
      },
    };
    const columns = [{ id: 'lt', column_name: 'notes', uidt: 'longText', type: 'longtext' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    const joined = lines.join(' ');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(joined).toContain('Task Alpha');
    expect(joined).not.toContain('rgb(');
    expect(joined).not.toContain('#abcdef');
    expect(joined).not.toContain('10px');
  });

  it('formats url/email/phone and rating fields', () => {
    const task = {
      ...baseTask,
      rawData: {
        website: 'https://example.com',
        mail: 'u@x.com',
        phone: '+1-111-222',
        rating: 4,
      },
    };
    const columns = [
      { id: 'u', column_name: 'website', uidt: 'URL' },
      { id: 'e', column_name: 'mail', uidt: 'Email' },
      { id: 'p', column_name: 'phone', uidt: 'PhoneNumber' },
      { id: 'r', column_name: 'rating', uidt: 'Rating' },
    ];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    const joined = lines.join(' ');
    expect(joined).toContain('https://example.com');
    expect(joined).toContain('u@x.com');
    expect(joined).toContain('+1-111-222');
    expect(joined).toContain('4');
  });

  it('formats arrays with filename and fileName keys', () => {
    const task = {
      ...baseTask,
      rawData: {
        files: [{ filename: 'a.pdf' }, { fileName: 'b.docx' }],
      },
    };
    const columns = [{ id: 'f', column_name: 'files', uidt: 'attachment' }];

    const lines = buildGanttTooltipLines({ task, columns, options: baseOptions });
    expect(lines.join(' ')).toContain('a.pdf, b.docx');
  });
});

