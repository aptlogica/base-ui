import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { AppearanceSettings } from '../AppearanceSettings';
import { ToastProvider } from '../../../../../components/common/Toast';

vi.mock('../../../../../hooks/useApi', () => ({
  useAddImage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ data: { url: 'https://example.com/image.png' } }),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('AppearanceSettings', () => {
  const mockOnChange = vi.fn();

  const defaultAppearance = {
    backgroundColor: '#ffffff',
    hideNocoBranding: false,
    hideBanner: false,
    layoutWidth: 'medium' as const,
    labelPosition: 'top' as const,
    fieldLayout: 'list' as const,
    cardStyle: 'flat' as const,
    align: 'left' as const,
    rounded: 'lg' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Appearance settings heading', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Appearance settings')).toBeInTheDocument();
    });

    it('should render Background Color label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Background Color')).toBeInTheDocument();
    });

    it('should render Primary Color label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Primary Color')).toBeInTheDocument();
    });

    it('should render Text Color label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Text Color')).toBeInTheDocument();
    });

    it('should render Hide Branding label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Hide Branding')).toBeInTheDocument();
    });

    it('should render Logo label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Logo')).toBeInTheDocument();
    });

    it('should render Hide Banner label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Hide Banner')).toBeInTheDocument();
    });

    it('should render Banner label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Banner')).toBeInTheDocument();
    });

    it('should render Layout Width label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Layout Width')).toBeInTheDocument();
    });

    it('should render Title Alignment label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Title Alignment')).toBeInTheDocument();
    });

    it('should render Label Position label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Label Position')).toBeInTheDocument();
    });

    it('should render Field Layout label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Field Layout')).toBeInTheDocument();
    });

    it('should render Card Style label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Card Style')).toBeInTheDocument();
    });

    it('should render Rounded Corners label', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Rounded Corners')).toBeInTheDocument();
    });
  });

  describe('Background color selection', () => {
    it('should call onChange with new backgroundColor when color is clicked', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      );
      fireEvent.click(colorButtons[1]);

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Toggle switches', () => {
    it('should call onChange when Hide Branding is toggled', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
      const brandingCheckbox = checkboxes[0];
      fireEvent.click(brandingCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ hideNocoBranding: true })
      );
    });

    it('should call onChange when Hide Banner is toggled', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
      const bannerCheckbox = checkboxes[1];
      fireEvent.click(bannerCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ hideBanner: true })
      );
    });
  });

  describe('Color inputs', () => {
    it('should call onChange when primary color changes', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const allInputs = document.querySelectorAll('input[type="color"]');
      expect(allInputs.length).toBeGreaterThanOrEqual(1);
      
      fireEvent.change(allInputs[0], { target: { value: '#ff0000' } });
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('URL input buttons', () => {
    it('should render Insert via URL button for logo', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const urlButtons = screen.getAllByText('Insert via URL');
      expect(urlButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Browse button for logo', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const browseButtons = screen.getAllByText('Browse');
      expect(browseButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined appearance prop', () => {
      render(
        <AppearanceSettings
          appearance={undefined}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Appearance settings')).toBeInTheDocument();
    });

    it('should handle empty appearance object', () => {
      render(
        <AppearanceSettings
          appearance={{}}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Appearance settings')).toBeInTheDocument();
    });
  });
});
