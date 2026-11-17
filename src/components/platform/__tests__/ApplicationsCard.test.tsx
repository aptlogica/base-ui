import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationsCard } from '../ApplicationsCard';

// The popup has its own tests; here it only needs to show it is open and close
vi.mock('../ApplicationsModal', () => ({
  ApplicationsModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Applications">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('ApplicationsCard', () => {
  it('opens the Applications popup on click and closes it', () => {
    render(<ApplicationsCard disabled={false} hasWorkspace />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/API to the bases you choose/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Applications/ }));
    expect(screen.getByRole('dialog', { name: 'Applications' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is disabled until a workspace is selected', () => {
    render(<ApplicationsCard disabled hasWorkspace={false} />);

    expect(screen.getByRole('button', { name: /Applications/ })).toBeDisabled();
    expect(screen.getByText('Select a workspace first.')).toBeInTheDocument();
  });
});
