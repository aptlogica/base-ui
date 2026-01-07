import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsButton from '../SettingsButton';

// Mock dependencies
vi.mock('../../../core/PluginRegistry', () => ({
  getRegisteredPlugins: vi.fn(() => [
    {
      manifest: {
        id: 'plugin-1',
        name: 'Test Plugin 1',
        version: '1.0.0',
      },
    },
    {
      manifest: {
        id: 'plugin-2',
        name: 'Test Plugin 2',
        version: '2.0.0',
      },
    },
  ]),
}));

vi.mock('../../../core/PluginConfigPanel', () => ({
  PluginConfigPanel: ({ pluginId }: { pluginId: string }) => (
    <div data-testid={`config-panel-${pluginId}`}>
      Config Panel for {pluginId}
    </div>
  ),
}));

vi.mock('../ConfigModal', () => ({
  default: ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!open) return null;
    return (
      <div data-testid="config-modal">
        <button data-testid="close-modal" onClick={onClose}>Close</button>
        <div data-testid="modal-content">{children}</div>
      </div>
    );
  },
}));

describe('SettingsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Rendering', () => {
    it('renders the settings button', () => {
      render(<SettingsButton />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has correct title attribute', () => {
      render(<SettingsButton />);
      
      expect(screen.getByTitle('Plugin Settings')).toBeInTheDocument();
    });

    it('renders settings icon', () => {
      const { container } = render(<SettingsButton />);
      
      // Should have an SVG icon
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct button styling classes', () => {
      render(<SettingsButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');
    });
  });

  describe('Modal Behavior', () => {
    it('modal is closed initially', () => {
      render(<SettingsButton />);
      
      expect(screen.queryByTestId('config-modal')).not.toBeInTheDocument();
    });

    it('opens modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('config-modal')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      expect(screen.getByTestId('config-modal')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-modal'));
      
      expect(screen.queryByTestId('config-modal')).not.toBeInTheDocument();
    });

    it('can open modal again after closing', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      // First open-close cycle
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('config-modal')).not.toBeInTheDocument();
      
      // Second open
      await user.click(screen.getByRole('button'));
      expect(screen.getByTestId('config-modal')).toBeInTheDocument();
    });
  });

  describe('Plugin List Rendering', () => {
    it('displays all registered plugins', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Test Plugin 1')).toBeInTheDocument();
      expect(screen.getByText('Test Plugin 2')).toBeInTheDocument();
    });

    it('renders config panel for each plugin', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('config-panel-plugin-1')).toBeInTheDocument();
      expect(screen.getByTestId('config-panel-plugin-2')).toBeInTheDocument();
    });

    it('displays settings icon next to each plugin name', async () => {
      const user = userEvent.setup();
      const { container } = render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      
      // Should have multiple settings icons (one for button, one for each plugin)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(3); // At least 1 + 2 plugins
    });
  });

  describe('Empty Plugin List', () => {
    it('handles empty plugin list gracefully', async () => {
      // Override mock for this test
      const { getRegisteredPlugins } = await import('../../../core/PluginRegistry');
      (getRegisteredPlugins as any).mockReturnValueOnce([]);
      
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByTestId('config-modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button is focusable', () => {
      render(<SettingsButton />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('button can be activated with keyboard', async () => {
      const user = userEvent.setup();
      render(<SettingsButton />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('config-modal')).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('has hover transition classes', () => {
      render(<SettingsButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });
  });
});

