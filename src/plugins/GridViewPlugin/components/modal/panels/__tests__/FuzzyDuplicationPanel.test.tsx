// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FuzzyDuplicationPanel } from '../FuzzyDuplicationPanel';

type Props = ComponentProps<typeof FuzzyDuplicationPanel>;

const createProps = (overrides: Partial<Props> = {}): Props => ({
  columns: [{ id: 'col-1', title: 'Name' } as Props['columns'][number]],
  selectedColumnIds: ['col-1'],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  fuzzySensitivity: 'medium',
  onFuzzySensitivityChange: vi.fn(),
  duplicateKeepRule: 'keep_first',
  onDuplicateKeepRuleChange: vi.fn(),
  duplicateAction: 'remove_row',
  onDuplicateActionChange: vi.fn(),
  onDeduplicationModeChange: vi.fn(),
  ...overrides,
});

describe('FuzzyDuplicationPanel', () => {
  it('renders sections and switches deduplication mode', () => {
    const props = createProps();
    render(<FuzzyDuplicationPanel {...props} />);

    expect(screen.getByText('Matching Method')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Manual'));
    expect(props.onDeduplicationModeChange).toHaveBeenCalledWith('manual');
    fireEvent.click(screen.getByText('Automatic'));
    expect(props.onDeduplicationModeChange).toHaveBeenCalledWith('automatic');
  });

  it('does not throw when no mode change handler is given', () => {
    render(<FuzzyDuplicationPanel {...createProps({ onDeduplicationModeChange: undefined, deduplicationMode: 'manual' })} />);
    fireEvent.click(screen.getByText('Automatic'));
    fireEvent.click(screen.getByText('Manual'));
  });

  it('reports sensitivity and duplicate action changes', () => {
    const props = createProps();
    render(<FuzzyDuplicationPanel {...props} />);

    fireEvent.click(screen.getByLabelText('High'));
    expect(props.onFuzzySensitivityChange).toHaveBeenCalledWith('high');
    fireEvent.click(screen.getByLabelText('Keep row and clear duplicate values'));
    expect(props.onDuplicateActionChange).toHaveBeenCalledWith('remove_duplicates');
  });

  it('normalizes the legacy misspelled keep rule', () => {
    render(<FuzzyDuplicationPanel {...createProps({ duplicateKeepRule: 'keep_lastest_updated' as any })} />);
    expect(screen.getByText('Keep last updated record')).toBeInTheDocument();
  });
});
