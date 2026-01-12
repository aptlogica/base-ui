import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { UserAvatarStack } from '../UserAvatarStack';

describe('UserAvatarStack', () => {
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com' },
    { id: '5', name: 'Charlie Brown', email: 'charlie@example.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when users array is empty', () => {
    const { container } = render(<UserAvatarStack users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders user avatars', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 2)} />);
    
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('displays initials when no avatar image', () => {
    render(<UserAvatarStack users={[mockUsers[0]]} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('limits visible avatars to maxVisible', () => {
    const { container } = render(
      <UserAvatarStack users={mockUsers} maxVisible={2} />
    );
    
    // Should show 2 avatars + 1 count badge ("+3")
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('displays remaining count when users exceed maxVisible', () => {
    render(<UserAvatarStack users={mockUsers} maxVisible={3} />);
    
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show count badge when showCount is false', () => {
    render(<UserAvatarStack users={mockUsers} maxVisible={2} showCount={false} />);
    
    expect(screen.queryByText('+3')).not.toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<UserAvatarStack users={mockUsers} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      expect(screen.getByText('Members (5)')).toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <UserAvatarStack users={mockUsers} />
        <button>Outside</button>
      </div>
    );
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      expect(screen.getByText('Members (5)')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    
    await waitFor(() => {
      expect(screen.queryByText('Members (5)')).not.toBeInTheDocument();
    });
  });

  it('displays all users in dropdown', async () => {
    const user = userEvent.setup();
    render(<UserAvatarStack users={mockUsers} maxVisible={2} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Williams')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });
  });

  it('displays user emails in dropdown', async () => {
    const user = userEvent.setup();
    render(<UserAvatarStack users={mockUsers.slice(0, 2)} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('calls onClick handler instead of showing dropdown', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<UserAvatarStack users={mockUsers} onClick={onClick} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Members (5)')).not.toBeInTheDocument();
  });

  it('does not show dropdown when showDropdown is false', async () => {
    const user = userEvent.setup();
    render(<UserAvatarStack users={mockUsers} showDropdown={false} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    expect(screen.queryByText('Members (5)')).not.toBeInTheDocument();
  });

  it('renders avatars in small size', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 1)} size="sm" />);
    
    const avatar = container.querySelector('.w-8');
    expect(avatar).toBeInTheDocument();
  });

  it('renders avatars in medium size', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 1)} size="md" />);
    
    const avatar = container.querySelector('.w-9');
    expect(avatar).toBeInTheDocument();
  });

  it('renders avatars in large size', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 1)} size="lg" />);
    
    const avatar = container.querySelector('.w-10');
    expect(avatar).toBeInTheDocument();
  });

  it('displays avatar image when provided', () => {
    const usersWithAvatar = [
      { ...mockUsers[0], avatar: 'https://example.com/avatar.jpg' },
    ];
    
    render(<UserAvatarStack users={usersWithAvatar} />);
    
    const img = screen.getByRole('img', { name: 'John Doe' });
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('generates correct initials for single name', () => {
    const users = [{ id: '1', name: 'John', email: 'john@example.com' }];
    render(<UserAvatarStack users={users} />);
    
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('generates correct initials for full name', () => {
    render(<UserAvatarStack users={[mockUsers[0]]} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <UserAvatarStack users={mockUsers} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('shows title attribute on avatars', () => {
    const { container } = render(<UserAvatarStack users={[mockUsers[0]]} />);
    
    const avatar = container.querySelector('[title="John Doe"]');
    expect(avatar).toBeInTheDocument();
  });

  it('shows title on remaining count badge', () => {
    const { container } = render(<UserAvatarStack users={mockUsers} maxVisible={3} />);
    
    const badge = container.querySelector('[title="2 more members"]');
    expect(badge).toBeInTheDocument();
  });

  it('handles users without email in dropdown', async () => {
    const user = userEvent.setup();
    const usersNoEmail = [{ id: '1', name: 'John Doe' }];
    
    render(<UserAvatarStack users={usersNoEmail} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('assigns consistent colors to user avatars', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 2)} />);
    
    const coloredAvatars = container.querySelectorAll('.rounded-full.flex.items-center.justify-center.text-white');
    expect(coloredAvatars.length).toBe(2);
    coloredAvatars.forEach(avatar => {
      const hasColorClass = avatar.className.includes('bg-');
      expect(hasColorClass).toBe(true);
    });
  });

  it('positions avatars with negative space', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 3)} />);
    
    const stack = container.querySelector('.-space-x-2');
    expect(stack).toBeInTheDocument();
  });

  it('applies z-index for stacking order', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 2)} maxVisible={2} />);
    
    const avatars = container.querySelectorAll('[style*="z-index"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('shows cursor pointer when clickable', () => {
    const { container } = render(<UserAvatarStack users={mockUsers} />);
    
    const stack = container.querySelector('.cursor-pointer');
    expect(stack).toBeInTheDocument();
  });

  it('displays separator line', () => {
    const { container } = render(<UserAvatarStack users={mockUsers} />);
    
    const separator = container.querySelector('.bg-gray-300');
    expect(separator).toBeInTheDocument();
  });

  it('dropdown has correct styling', async () => {
    const user = userEvent.setup();
    render(<UserAvatarStack users={mockUsers} />);
    
    const stack = screen.getByText('JD').closest('div')?.parentElement;
    await user.click(stack!);
    
    await waitFor(() => {
      const dropdown = screen.getByText('Members (5)').closest('.fixed');
      expect(dropdown).toHaveClass('z-50', 'w-72', 'bg-card');
    });
  });

  it('handles single user correctly', () => {
    render(<UserAvatarStack users={[mockUsers[0]]} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('shows correct count for singular member', () => {
    const { container } = render(<UserAvatarStack users={mockUsers.slice(0, 4)} maxVisible={3} />);
    
    const badge = container.querySelector('[title="1 more member"]');
    expect(badge).toBeInTheDocument();
  });
});
