import { describe, it, expect } from 'vitest';
import type { LabelColumn } from '../recordLabel';
import {
  buildUserNameMap,
  getDefaultDisplayColumn,
  getDisplayColumnId,
  getLinkDisplayColumn,
  getRecordLabel,
  getRecordSearchText,
  getRecordTitleColumn,
  isDisplayColumnCandidate,
  isLegacyTitleColumn,
  isTextColumn,
} from '../recordLabel';

const name = { id: 'n', column_name: 'name_1_ab12', uidt: 'text', order_index: 2 };
const notes = { id: 'o', column_name: 'notes', uidt: 'longText', order_index: 5 };
const age = { id: 'a', column_name: 'age', uidt: 'number', order_index: 1 };
const legacyTitle = { id: 't', column_name: 'title', uidt: 'text', system: true, order_index: 1 };

describe('isLegacyTitleColumn', () => {
  it('is only the system column named title', () => {
    expect(isLegacyTitleColumn(legacyTitle)).toBe(true);
    expect(isLegacyTitleColumn({ column_name: 'title', uidt: 'text', system: false })).toBe(false);
    expect(isLegacyTitleColumn({ column_name: 'title_1761_ab12', uidt: 'text' })).toBe(false);
    expect(isLegacyTitleColumn({ column_name: 'created_time', system: true })).toBe(false);
  });
});

describe('isDisplayColumnCandidate', () => {
  it('accepts plain fields and the legacy Title', () => {
    expect(isDisplayColumnCandidate(name)).toBe(true);
    expect(isDisplayColumnCandidate(age)).toBe(true);
    expect(isDisplayColumnCandidate(legacyTitle)).toBe(true);
    expect(isDisplayColumnCandidate({ id: 'i', column_name: 'id', uidt: 'number', system: true })).toBe(true);
  });

  it('rejects links, lookups, rollups, attachments, JSON, system and deleted fields', () => {
    for (const uidt of ['links', 'lookup', 'rollup', 'attachment', 'json', 'JSON']) {
      expect(isDisplayColumnCandidate({ column_name: 'x', uidt })).toBe(false);
    }
    expect(isDisplayColumnCandidate({ column_name: 'created_time', uidt: 'datetime', system: true })).toBe(false);
    expect(isDisplayColumnCandidate({ ...name, deleted: true })).toBe(false);
  });

  it('reads the type from type when uidt is missing', () => {
    expect(isTextColumn({ column_name: 'x', type: 'text' })).toBe(true);
    expect(isTextColumn({ column_name: 'x', type: 'number' })).toBe(false);
  });
});

describe('getRecordTitleColumn', () => {
  it('is the first text column by order index', () => {
    expect(getRecordTitleColumn([age, notes, name])?.id).toBe('n');
  });

  it('counts the legacy Title and ignores other system columns', () => {
    expect(getRecordTitleColumn<LabelColumn>([{ column_name: 'id', uidt: 'number', system: true }, legacyTitle, name])?.id).toBe('t');
  });

  it('is undefined when there is no text column', () => {
    expect(getRecordTitleColumn([age])).toBeUndefined();
    expect(getRecordTitleColumn(undefined)).toBeUndefined();
  });

  it('keeps the first of equal indexes and puts unordered columns last', () => {
    expect(getRecordTitleColumn([{ id: 'a', column_name: 'a', uidt: 'text' }, { id: 'b', column_name: 'b', uidt: 'text', order_index: 9 }])?.id).toBe('b');
    expect(getRecordTitleColumn([{ id: 'a', column_name: 'a', uidt: 'text' }, { id: 'b', column_name: 'b', uidt: 'text' }])?.id).toBe('a');
  });
});

describe('getDisplayColumnId', () => {
  it('reads an object or a JSON string', () => {
    expect(getDisplayColumnId({ display_column_id: 'n' })).toBe('n');
    expect(getDisplayColumnId('{"display_column_id":"n"}')).toBe('n');
    expect(getDisplayColumnId('not json')).toBe('');
    expect(getDisplayColumnId(undefined)).toBe('');
  });
});

describe('getLinkDisplayColumn', () => {
  const columns = [age, name, notes];

  it('uses the column the link names', () => {
    expect(getLinkDisplayColumn({ display_column_id: 'o' }, columns)?.id).toBe('o');
  });

  it('falls back to the first text column when none is named or the named one is gone', () => {
    expect(getLinkDisplayColumn({}, columns)?.id).toBe('n');
    expect(getLinkDisplayColumn({ display_column_id: 'missing' }, columns)?.id).toBe('n');
  });

  it('does not use a named column that can no longer label records', () => {
    const files = { id: 'f', column_name: 'files', uidt: 'attachment' };
    expect(getLinkDisplayColumn({ display_column_id: 'f' }, [files, name])?.id).toBe('n');
  });

  it('is undefined for a table with no usable column', () => {
    expect(getLinkDisplayColumn({ display_column_id: 'a' }, [])).toBeUndefined();
  });
});

describe('getRecordLabel', () => {
  it('is the column value', () => {
    expect(getRecordLabel({ id: 1, name_1_ab12: '  Acme  ' }, name)).toBe('Acme');
    expect(getRecordLabel({ id: 1, age: 42 }, age)).toBe('42');
  });

  it('is Record <id> when the value is empty or the column is missing', () => {
    expect(getRecordLabel({ id: 12, name_1_ab12: '' }, name)).toBe('Record 12');
    expect(getRecordLabel({ id: 12, name_1_ab12: null }, name)).toBe('Record 12');
    expect(getRecordLabel({ id: 12 }, undefined)).toBe('Record 12');
  });

  it('joins lists and ignores objects', () => {
    expect(getRecordLabel({ id: 1, name_1_ab12: ['a', 'b'] }, name)).toBe('a, b');
    expect(getRecordLabel({ id: 3, name_1_ab12: { x: 1 } }, name)).toBe('Record 3');
  });

  it('has no label without a record', () => {
    expect(getRecordLabel(null, name)).toBe('');
  });
});

describe('getRecordSearchText', () => {
  it('is the lower-cased value of the column', () => {
    expect(getRecordSearchText({ id: 1, name_1_ab12: 'Acme Corp' }, name)).toBe('acme corp');
    expect(getRecordSearchText({ id: 1 }, name)).toBe('');
    expect(getRecordSearchText({ id: 1, name_1_ab12: 'x' }, undefined)).toBe('');
  });
});

describe('getDefaultDisplayColumn', () => {
  const idColumn = { id: 'i', column_name: 'id', uidt: 'number', system: true, order_index: 0 };

  it('is the Id column when the table has one', () => {
    expect(getDefaultDisplayColumn([name, idColumn, notes])?.id).toBe('i');
  });

  it('falls back to the first text column, then to nothing', () => {
    expect(getDefaultDisplayColumn([age, name])?.id).toBe('n');
    expect(getDefaultDisplayColumn([age])).toBeUndefined();
  });
});

describe('user display column', () => {
  const owner = { id: 'o', column_name: 'owner_1_ab12', uidt: 'user', order_index: 1 };
  const names = buildUserNameMap([
    { id: 'u1', display_name: 'John Carter' },
    { id: 'u2', first_name: 'Jane', last_name: 'Doe' },
    { id: 'u3', email: 'x@y.com' },
  ]);

  it('builds names from display name, full name, then email', () => {
    expect(names).toEqual({ u1: 'John Carter', u2: 'Jane Doe', u3: 'x@y.com' });
    expect(buildUserNameMap(undefined)).toEqual({});
  });

  it('labels a record by the user name instead of the id', () => {
    expect(getRecordLabel({ id: 1, owner_1_ab12: 'u1' }, owner, names)).toBe('John Carter');
    expect(getRecordLabel({ id: 1, owner_1_ab12: ['u1', 'u2'] }, owner, names)).toBe('John Carter, Jane Doe');
    expect(getRecordLabel({ id: 1, owner_1_ab12: 'u1, u9' }, owner, names)).toBe('John Carter, u9');
  });

  it('skips invalid users and ignores non-string name fields', () => {
    const map = buildUserNameMap([null, {}, { id: 'a', display_name: 5, first_name: 'Sam' }, { id: 'b', email: 7 }]);
    expect(map).toEqual({ a: 'Sam', b: 'b' });
  });

  it('keeps raw values without a name map or for non-user columns', () => {
    expect(getRecordLabel({ id: 1, owner_1_ab12: 'u1' }, owner)).toBe('u1');
    expect(getRecordLabel({ id: 1, t: 'u1' }, { column_name: 't', uidt: 'text' }, names)).toBe('u1');
  });

  it('drops objects and blanks from a user list and falls back when nothing is left', () => {
    expect(getRecordLabel({ id: 1, owner_1_ab12: ['u1', {}, ' '] }, owner, names)).toBe('John Carter');
    expect(getRecordLabel({ id: 7, owner_1_ab12: [{}] }, owner, names)).toBe('Record 7');
  });

  it('searches by the user name', () => {
    expect(getRecordSearchText({ id: 1, owner_1_ab12: 'u1' }, owner, names)).toBe('john carter');
  });
});
