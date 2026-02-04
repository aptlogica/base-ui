import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '../Search';

vi.mock('../../../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(() => ({ current: null })),
}));

vi.mock('../../../../types/constants', () => ({
  fieldsToExcludeInFilter: [],
}));

const defaultColumns = [
  { key: 'name', title: 'Name', column_name: 'name', type: 'text' },
  { key: 'email', title: 'Email', column_name: 'email', type: 'email' },
];

describe('Search', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input with first column placeholder', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search in Name')).toBeInTheDocument();
  });

  it('should render field selector button with first column title', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should apply className to wrapper', () => {
    const { container } = render(
      <Search columns={defaultColumns} onSearch={mockOnSearch} className="my-search" />
    );
    expect(container.querySelector('.my-search')).toBeInTheDocument();
  });

  it('should be disabled when disabled is true', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} disabled />);
    const input = document.querySelector('input[type="text"]');
    expect(input).toHaveAttribute('disabled');
  });

  it('should call onSearch when input is cleared', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search in Name');
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    expect(mockOnSearch).toHaveBeenCalledWith('', expect.anything());
  });

  it('should open dropdown when field selector is clicked', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    const button = screen.getByText('Name').closest('button');
    if (button) {
      await userEvent.click(button);
      expect(screen.getByPlaceholderText('Search fields')).toBeInTheDocument();
    }
  });

  it('should use initialSelectedField when provided', () => {
    render(
      <Search
        columns={defaultColumns}
        onSearch={mockOnSearch}
        initialSelectedField={{ key: 'email', title: 'Email', type: 'email' }}
      />
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render when columns is empty', () => {
    render(<Search columns={[]} onSearch={mockOnSearch} />);
    expect(document.body).toBeInTheDocument();
  });
});
