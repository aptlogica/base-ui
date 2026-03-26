import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

const { navigationStoreMock } = vi.hoisted(() => ({
  navigationStoreMock: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => navigationStoreMock(),
}));

import HeaderLogo from '../HeaderLogo';

describe('HeaderLogo', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    navigationStoreMock.mockReset();
    navigationStoreMock.mockReturnValue({ selectedWorkspaceId: null });
  });

  it('renders the logo image by default', () => {
    render(<HeaderLogo />);

    expect(screen.getByTitle('Go to Homepage')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('navigates to /homepage when clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderLogo />);

    await user.click(screen.getByTitle('Go to Homepage'));

    expect(navigateMock).toHaveBeenCalledWith('/workspace');
  });

  it('navigates to selected workspace when available', async () => {
    navigationStoreMock.mockReturnValue({ selectedWorkspaceId: 'ws-123' });
    const user = userEvent.setup();
    render(<HeaderLogo />);

    await user.click(screen.getByTitle('Go to Homepage'));

    expect(navigateMock).toHaveBeenCalledWith('/workspace/ws-123');
  });

  it('swaps the image out on hover', () => {
    const { container } = render(<HeaderLogo />);

    expect(screen.getByAltText('Logo')).toBeInTheDocument();

    const button = screen.getByTitle('Go to Homepage');
    fireEvent.mouseEnter(button);

    expect(screen.queryByAltText('Logo')).toBeNull();

    // lucide icons render an inline svg
    expect(container.querySelector('svg')).not.toBeNull();

    fireEvent.mouseLeave(button);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });
});
