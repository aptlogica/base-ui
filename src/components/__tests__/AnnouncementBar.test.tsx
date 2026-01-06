import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AnnouncementBar } from '../AnnouncementBar';

describe('AnnouncementBar', () => {
  it('renders null when not visible', () => {
    const { container } = render(
      <AnnouncementBar visible={false} message="Hello" type="info" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders message and buttons when visible', async () => {
    const user = userEvent.setup();

    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <AnnouncementBar
        visible
        type="warning"
        message={<span>Heads up</span>}
        buttons={[
          { label: 'Primary', onClick: onPrimary, style: 'primary' },
          { label: 'Secondary', onClick: onSecondary, style: 'secondary' },
        ]}
      />
    );

    expect(screen.getByText('Heads up')).toBeInTheDocument();

    const primary = screen.getByRole('button', { name: 'Primary' });
    const secondary = screen.getByRole('button', { name: 'Secondary' });

    await user.click(primary);
    await user.click(secondary);

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('applies type styling class based on type', () => {
    const { container } = render(
      <AnnouncementBar visible message="Ok" type="success" />
    );

    const root = container.firstElementChild as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(root).toHaveClass('bg-green-100');
    expect(root).toHaveClass('text-green-800');
  });
});
