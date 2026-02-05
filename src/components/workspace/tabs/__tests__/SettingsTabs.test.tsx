import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SettingsTabs } from '../SettingsTabs';

describe('SettingsTabs', () => {
  const defaultTabs = [
    { key: 'profile', label: 'Profile', icon: 'User' },
    { key: 'workspace', label: 'Workspace', icon: 'Building2' },
    { key: 'tenant', label: 'Tenant', icon: 'Settings' },
  ];

  const defaultProps = {
    tabs: defaultTabs,
    activeTab: 'profile',
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all tab labels', () => {
      render(<SettingsTabs {...defaultProps} />);

      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /workspace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tenant/i })).toBeInTheDocument();
    });

    it('renders within a nav element', () => {
      const { container } = render(<SettingsTabs {...defaultProps} />);

      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('applies active styling to the active tab', () => {
      render(<SettingsTabs {...defaultProps} activeTab="workspace" />);

      const workspaceButton = screen.getByRole('button', { name: /workspace/i });
      expect(workspaceButton.className).toContain('border-[var(--color-brand-700)]');
    });

    it('renders tab with upcoming flag without crashing', () => {
      const tabsWithUpcoming = [
        ...defaultTabs,
        { key: 'upcoming', label: 'Upcoming', icon: 'Clock', upcoming: true },
      ];

      render(
        <SettingsTabs
          tabs={tabsWithUpcoming}
          activeTab="profile"
          onTabChange={defaultProps.onTabChange}
        />
      );

      expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
    });

    it('renders empty tabs without crashing', () => {
      render(
        <SettingsTabs tabs={[]} activeTab="" onTabChange={defaultProps.onTabChange} />
      );

      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('Interaction', () => {
    it('calls onTabChange with tab key when a tab is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /tenant/i }));

      expect(defaultProps.onTabChange).toHaveBeenCalledTimes(1);
      expect(defaultProps.onTabChange).toHaveBeenCalledWith('tenant');
    });

    it('calls onTabChange with correct key when first tab is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /profile/i }));

      expect(defaultProps.onTabChange).toHaveBeenCalledWith('profile');
    });

    it('calls onTabChange with correct key when second tab is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /workspace/i }));

      expect(defaultProps.onTabChange).toHaveBeenCalledWith('workspace');
    });
  });

  describe('Edge cases', () => {
    it('renders tab with unknown icon name without crashing', () => {
      const tabsWithUnknownIcon = [
        { key: 'unknown', label: 'Unknown', icon: 'NonExistentIcon' },
      ];

      render(
        <SettingsTabs
          tabs={tabsWithUnknownIcon}
          activeTab="unknown"
          onTabChange={defaultProps.onTabChange}
        />
      );

      expect(screen.getByRole('button', { name: /unknown/i })).toBeInTheDocument();
    });

    it('renders single tab correctly', () => {
      const singleTab = [defaultTabs[0]];

      render(
        <SettingsTabs
          tabs={singleTab}
          activeTab="profile"
          onTabChange={defaultProps.onTabChange}
        />
      );

      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(1);
    });
  });
});
