import { describe, it, expect } from 'vitest';
import { buildEventTooltipLines } from '../buildEventTooltip';

describe('buildEventTooltip', () => {
  const mockFormatTime = (t: string) => t;

  describe('buildEventTooltipLines', () => {
    it('should return empty array for null event', () => {
      const result = buildEventTooltipLines({
        event: null,
        columns: [],
        options: { formatTime: mockFormatTime }
      });
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined event', () => {
      const result = buildEventTooltipLines({
        event: undefined as any,
        columns: [],
        options: { formatTime: mockFormatTime }
      });
      expect(result).toEqual([]);
    });

    it('should format event title with date', () => {
      const event = {
        title: 'Test Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        isDateField: false,
        data: {}
      };

      const result = buildEventTooltipLines({
        event,
        columns: [],
        options: { formatTime: mockFormatTime }
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Test Event');
      expect(result[0]).toContain('2026-01-30');
    });

    it('should format event title with date only for date fields', () => {
      const event = {
        title: 'Date Event',
        dateTime: new Date('2026-01-30T00:00:00'),
        isDateField: true,
        data: {}
      };

      const result = buildEventTooltipLines({
        event,
        columns: [],
        options: { formatTime: mockFormatTime }
      });

      expect(result[0]).toContain('Date Event');
      expect(result[0]).toContain('2026-01-30');
      expect(result[0]).not.toMatch(/\d{2}:\d{2}/);
    });

    it('should handle event without title', () => {
      const event = {
        title: '',
        dateTime: new Date('2026-01-30T14:30:00'),
        isDateField: false,
        data: {}
      };

      const result = buildEventTooltipLines({
        event,
        columns: [],
        options: { formatTime: mockFormatTime }
      });

      expect(result).toEqual([]);
    });

    it('should format currency field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { price: 1234.56 }
      };

      const columns = [
        { id: '1', key: 'price', columnName: 'price', title: 'Price', type: 'currency' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const priceField = result.find(line => line.includes('$1,234.56'));
      expect(priceField).toBeTruthy();
    });

    it('should format percent field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { progress: 75 }
      };

      const columns = [
        { id: '1', key: 'progress', columnName: 'progress', title: 'Progress', type: 'percent' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const percentField = result.find(line => line.includes('75%'));
      expect(percentField).toBeTruthy();
    });

    it('should format email field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { contact: 'test@example.com' }
      };

      const columns = [
        { id: '1', key: 'contact', columnName: 'contact', title: 'Contact', type: 'email' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const emailField = result.find(line => line.includes('test@example.com'));
      expect(emailField).toBeTruthy();
    });

    it('should format phone field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { phone: '123-456-7890' }
      };

      const columns = [
        { id: '1', key: 'phone', columnName: 'phone', title: 'Phone', type: 'phone' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const phoneField = result.find(line => line.includes('123-456-7890'));
      expect(phoneField).toBeTruthy();
    });

    it('should format number field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { count: 1000 }
      };

      const columns = [
        { id: '1', key: 'count', columnName: 'count', title: 'Count', type: 'number' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const numberField = result.find(line => line.includes('1,000'));
      expect(numberField).toBeTruthy();
    });

    it('should format decimal field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { rate: 3.5 }
      };

      const columns = [
        { id: '1', key: 'rate', columnName: 'rate', title: 'Rate', type: 'decimal' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const decimalField = result.find(line => line.includes('3.50'));
      expect(decimalField).toBeTruthy();
    });

    it('should format date field in tooltip content', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { dueDate: '2026-02-15' }
      };

      const columns = [
        { id: '1', key: 'dueDate', columnName: 'dueDate', title: 'Due Date', type: 'date' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const dateField = result.find(line => line.includes('2026-02-15'));
      expect(dateField).toBeTruthy();
    });

    it('should format datetime field in tooltip content', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { scheduledAt: '2026-02-15T10:30:00' }
      };

      const columns = [
        { id: '1', key: 'scheduledAt', columnName: 'scheduledAt', title: 'Scheduled', type: 'datetime' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const datetimeField = result.find(line => line.includes('2026-02-15'));
      expect(datetimeField).toBeTruthy();
    });

    it('should format multiselect field', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { choices: ['tag1', 'tag2', 'tag3'] }
      };

      const columns = [
        { id: '1', key: 'choices', columnName: 'choices', title: 'Choices', type: 'multiselect' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      // Multiselect values are joined (format: tag1, tag2, tag3 or similar)
      const hasAllTags = result.some(
        (line) => line.includes('tag1') && line.includes('tag2') && line.includes('tag3')
      );
      expect(hasAllTags).toBe(true);
    });

    it('should handle null values with hyphen', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { description: null }
      };

      const columns = [
        { id: '1', key: 'description', columnName: 'description', title: 'Description', type: 'text' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const descField = result.find(line => line.includes('-'));
      expect(descField).toBeTruthy();
    });

    it('should skip title field in tooltip content', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { title: 'Event' }
      };

      const columns = [
        { id: '1', key: 'title', columnName: 'title', title: 'Title', type: 'text' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const hasTitleField = result.some(line => line.toLowerCase().includes('title') && line !== result[0]);
      expect(hasTitleField).toBe(false);
    });

    it('should skip system fields', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { id: '123', systemField: 'value' }
      };

      const columns = [
        { id: '1', key: 'systemField', columnName: 'systemField', title: 'System', type: 'text', system: true }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const hasSystemField = result.some(line => line.includes('System'));
      expect(hasSystemField).toBe(false);
    });

    it('should respect fieldConfig visibility', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { hidden: 'secret', visible: 'shown' }
      };

      const columns = [
        { id: '1', key: 'hidden', columnName: 'hidden', title: 'Hidden', type: 'text' },
        { id: '2', key: 'visible', columnName: 'visible', title: 'Visible', type: 'text' }
      ];

      const fieldConfig = [
        { id: '1', isHidden: true },
        { id: '2', isHidden: false }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime, fieldConfig }
      });

      const hasHiddenField = result.some(line => line.includes('secret'));
      const hasVisibleField = result.some(line => line.includes('shown'));
      expect(hasHiddenField).toBe(false);
      expect(hasVisibleField).toBe(true);
    });

    it('should truncate long text values', () => {
      const longText = 'a'.repeat(100);
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { description: longText }
      };

      const columns = [
        { id: '1', key: 'description', columnName: 'description', title: 'Description', type: 'text' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const descField = result.find(line => line.includes('...'));
      expect(descField).toBeTruthy();
    });

    it('should clean rich text content', () => {
      const richText = '<p>Hello <strong>World</strong></p>';
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { content: richText }
      };

      const columns = [
        { id: '1', key: 'content', columnName: 'content', title: 'Content', type: 'longtext', uidt: 'longText' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const contentField = result.find(line => line.includes('Hello World'));
      expect(contentField).toBeTruthy();
      const hasHTML = result.some(line => line.includes('<') || line.includes('>'));
      expect(hasHTML).toBe(false);
    });

    it('should handle array values as links', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { attachments: [{ title: 'File1' }, { title: 'File2' }] }
      };

      const columns = [
        { id: '1', key: 'attachments', columnName: 'attachments', title: 'Attachments', type: 'attachment' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const attachmentField = result.find(line => line.includes('File1') && line.includes('File2'));
      expect(attachmentField).toBeTruthy();
    });

    it('should handle object values with name property', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { user: { name: 'John Doe' } }
      };

      const columns = [
        { id: '1', key: 'user', columnName: 'user', title: 'User', type: 'lookup' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const userField = result.find(line => line.includes('John Doe'));
      expect(userField).toBeTruthy();
    });

    it('should handle invalid currency values', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { price: 'invalid' }
      };

      const columns = [
        { id: '1', key: 'price', columnName: 'price', title: 'Price', type: 'currency' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const priceField = result.find(line => line.includes('-'));
      expect(priceField).toBeTruthy();
    });

    it('should handle invalid date values', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { dueDate: 'invalid-date' }
      };

      const columns = [
        { id: '1', key: 'dueDate', columnName: 'dueDate', title: 'Due Date', type: 'date' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      expect(result).toBeDefined();
    });

    it('should handle formatting errors gracefully', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { field: Symbol('test') }
      };

      const columns = [
        { id: '1', key: 'field', columnName: 'field', title: 'Field', type: 'text' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      expect(result).toBeDefined();
    });

    it('should group fields into lines', () => {
      const event = {
        title: 'Event',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: { field1: 'value1', field2: 'value2', field3: 'value3', field4: 'value4' }
      };

      const columns = [
        { id: '1', key: 'field1', columnName: 'field1', title: 'Field 1', type: 'text' },
        { id: '2', key: 'field2', columnName: 'field2', title: 'Field 2', type: 'text' },
        { id: '3', key: 'field3', columnName: 'field3', title: 'Field 3', type: 'text' },
        { id: '4', key: 'field4', columnName: 'field4', title: 'Field 4', type: 'text' }
      ];

      const result = buildEventTooltipLines({
        event,
        columns,
        options: { formatTime: mockFormatTime }
      });

      const hasMultipleFields = result.some(line => line.includes('•') && line.split('•').length > 2);
      expect(hasMultipleFields).toBe(true);
    });
  });
});

describe('buildEventTooltipLines - additional coverage', () => {
  const formatTime = (t: string) => `fmt-${t}`;

  it('skips category/tag/type keys', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: { category: 'Work', tags: 'Blue', itemType: 'Task', notes: 'Visible' },
    };

    const columns = [
      { id: '1', columnName: 'category', type: 'text' },
      { id: '2', columnName: 'tags', type: 'text' },
      { id: '3', columnName: 'itemType', type: 'text' },
      { id: '4', columnName: 'notes', type: 'text' },
    ];

    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });
    const joined = lines.join(' ');
    expect(joined).toContain('Visible');
    expect(joined).not.toContain('Work');
    expect(joined).not.toContain('Blue');
    expect(joined).not.toContain('Task');
  });

  it('falls back to event root value when data map is missing', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      owner: 'Alice',
    };

    const columns = [{ id: '1', columnName: 'owner', type: 'text' }];
    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });

    expect(lines.join(' ')).toContain('Alice');
  });

  it('uses raw time string when pattern is not HH:mm', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: { slot: '9am' },
    };

    const columns = [{ id: '1', columnName: 'slot', type: 'time' }];
    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });

    expect(lines.join(' ')).toContain('9am');
    expect(lines.join(' ')).not.toContain('fmt-9am');
  });

  it('truncates very long plain text values', () => {
    const longText = 'x'.repeat(80);
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: { notes: longText },
    };

    const columns = [{ id: '1', columnName: 'notes', type: 'text' }];
    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });

    expect(lines.join(' ')).toContain('...' );
  });
});

describe('buildEventTooltipLines - rich text and fallback branches', () => {
  const formatTime = (t: string) => `fmt-${t}`;

  it('cleans rich text entities and css-like fragments aggressively', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: {
        notes: '<div>Alpha&nbsp;&amp;&quot;Beta&quot; color:red; margin:10px; width:5em; opacity:50%; rgb(1,2,3) #abcdef</div>',
      },
    };
    const columns = [{ id: '1', columnName: 'notes', uidt: 'longText', type: 'longtext' }];

    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });
    const joined = lines.join(' ');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(joined).toContain('Event');
    expect(joined).not.toContain('rgb(');
    expect(joined).not.toContain('#abcdef');
    expect(joined).not.toContain('10px');
  });

  it('formats array values using filename and fileName fallbacks', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: {
        files: [{ filename: 'a.pdf' }, { fileName: 'b.docx' }],
      },
    };
    const columns = [{ id: '1', columnName: 'files', type: 'attachment' }];

    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });
    expect(lines.join(' ')).toContain('a.pdf, b.docx');
  });

  it('renders unknown object shape as hyphen', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: {
        obj: { deep: { nested: true } },
      },
    };
    const columns = [{ id: '1', columnName: 'obj', type: 'lookup' }];

    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });
    expect(lines.join(' ')).toContain('-');
  });

  it('orders prioritized fields before plain text in grouped lines', () => {
    const event = {
      title: 'Event',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: {
        textField: 'tail',
        price: 10,
        percent: 20,
        email: 'x@y.com',
      },
    };
    const columns = [
      { id: 't', columnName: 'textField', type: 'text' },
      { id: 'p1', columnName: 'price', type: 'currency' },
      { id: 'p2', columnName: 'percent', type: 'percent' },
      { id: 'p3', columnName: 'email', type: 'email' },
    ];

    const lines = buildEventTooltipLines({ event, columns, options: { formatTime } });
    expect(lines[1]).toContain('$10.00');
    expect(lines[1]).toContain('20%');
    expect(lines[1]).toContain('x@y.com');
  });
});


