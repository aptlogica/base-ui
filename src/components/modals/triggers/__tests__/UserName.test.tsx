import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserName from '../UserName';
import { useUserProfile } from '../../../../hooks/useApi';

vi.mock('../../../../hooks/useApi', () => ({
  useUserProfile: vi.fn(),
}));

const useUserProfileMock = vi.mocked(useUserProfile);
const profile = (data: unknown) => useUserProfileMock.mockReturnValue({ data } as any);

describe('UserName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile(undefined);
  });

  it('shows a dash when there is no user id', () => {
    render(<UserName />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(useUserProfileMock).toHaveBeenCalledWith('');
  });

  it('prefers the display name', () => {
    profile({ data: { display_name: 'Aditya M', first_name: 'Aditya', email: 'a@x.com' } });
    render(<UserName userId="u1" />);
    expect(screen.getByText('Aditya M')).toBeInTheDocument();
    expect(useUserProfileMock).toHaveBeenCalledWith('u1');
  });

  it('falls back to first and last name, then email', () => {
    profile({ data: { first_name: 'Aditya', last_name: 'Mane' } });
    const { rerender } = render(<UserName userId="u1" />);
    expect(screen.getByText('Aditya Mane')).toBeInTheDocument();

    profile({ data: { email: 'a@x.com' } });
    rerender(<UserName userId="u1" />);
    expect(screen.getByText('a@x.com')).toBeInTheDocument();
  });

  it('shows the user id while the profile is not loaded', () => {
    render(<UserName userId="u1" />);
    expect(screen.getByText('u1')).toBeInTheDocument();
  });
});
