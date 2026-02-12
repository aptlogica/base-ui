import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  FIELD_TYPES,
  FieldType,
  getFieldTypeInfo,
  getFieldTypeIconComponent,
  getFieldTypeIconWithMargin,
} from '../fieldTypes';

describe('fieldTypes', () => {
  it('returns matching field type info', () => {
    const info = getFieldTypeInfo(FieldType.Text);
    expect(info.key).toBe('text');
    expect(info.label).toBe('Single line text');
  });

  it('falls back to first entry when type is unknown', () => {
    const info = getFieldTypeInfo('unknown');
    expect(info).toEqual(FIELD_TYPES[0]);
  });

  it('renders icon component for a field type', () => {
    const icon = getFieldTypeIconComponent(FieldType.Text);
    const { container } = render(<div>{icon}</div>);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders icon component with margin', () => {
    const icon = getFieldTypeIconWithMargin(FieldType.Text);
    const { container } = render(<div>{icon}</div>);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class') || '').toContain('mr-2');
  });
});
