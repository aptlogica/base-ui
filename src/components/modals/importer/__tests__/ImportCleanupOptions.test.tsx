import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportCleanupOptions, type ImportCleanupOptionsState } from '../ImportCleanupOptions';

type CleanupOptionKey = keyof ImportCleanupOptionsState;

describe('ImportCleanupOptions', () => {
  const defaultValue: ImportCleanupOptionsState = {
    removeDuplicateRecords: false,
    trimExtraSpaces: false,
    removeEmptyRows: false,
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it.each([
      { name: 'section title', text: 'Clean & Map Data' },
      {
        name: 'section description',
        text: 'Apply cleaning rules and map incoming columns to structured fields for accurate import.',
      },
      { name: 'remove duplicate records option', text: 'Remove duplicate records' },
      { name: 'trim extra spaces option', text: 'Trim extra spaces' },
      { name: 'remove empty rows option', text: 'Remove empty rows' },
    ])('should render $name', ({ text }) => {
      render(<ImportCleanupOptions value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  describe('Toggle interactions', () => {
    it.each<{
      optionLabel: string;
      optionKey: CleanupOptionKey;
    }>([
      { optionLabel: 'Remove duplicate records', optionKey: 'removeDuplicateRecords' },
      { optionLabel: 'Trim extra spaces', optionKey: 'trimExtraSpaces' },
      { optionLabel: 'Remove empty rows', optionKey: 'removeEmptyRows' },
    ])('should enable $optionKey when $optionLabel is toggled on', async ({ optionLabel, optionKey }) => {
      const user = userEvent.setup();
      render(<ImportCleanupOptions value={defaultValue} onChange={mockOnChange} />);

      await user.click(screen.getByText(optionLabel));

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValue,
        [optionKey]: true,
      });
    });

    it('should disable remove duplicate records when toggled off', async () => {
      const user = userEvent.setup();
      const value: ImportCleanupOptionsState = {
        ...defaultValue,
        removeDuplicateRecords: true,
      };
      render(<ImportCleanupOptions value={value} onChange={mockOnChange} />);

      await user.click(screen.getByText('Remove duplicate records'));

      expect(mockOnChange).toHaveBeenCalledWith({
        ...value,
        removeDuplicateRecords: false,
      });
    });
  });

  describe('Checked state', () => {
    it.each<{
      optionLabel: string;
      value: ImportCleanupOptionsState;
      checked: boolean;
    }>([
      {
        optionLabel: 'Remove duplicate records',
        value: { ...defaultValue, removeDuplicateRecords: true },
        checked: true,
      },
      {
        optionLabel: 'Trim extra spaces',
        value: defaultValue,
        checked: false,
      },
    ])(
      'should show $optionLabel checkbox as $checked when configured',
      ({ optionLabel, value, checked }) => {
        render(<ImportCleanupOptions value={value} onChange={mockOnChange} />);

        const toggle = screen.getByRole('button', { name: optionLabel });
        const checkbox = within(toggle).getByRole('checkbox');

        expect(checkbox).toHaveProperty('checked', checked);
      }
    );
  });
});
