import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadMoreButton } from '../LoadMoreButton';

describe('LoadMoreButton', () => {
  it('renders label and handles click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <LoadMoreButton
        label="Load more (5 remaining)"
        isLoading={false}
        onClick={onClick}
      />
    );

    expect(screen.getByText('Load more (5 remaining)')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loader and disables button when loading', () => {
    render(
      <LoadMoreButton
        label="Load more (5 remaining)"
        isLoading={true}
        onClick={vi.fn()}
      />
    );

    expect(screen.queryByText('Load more (5 remaining)')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
