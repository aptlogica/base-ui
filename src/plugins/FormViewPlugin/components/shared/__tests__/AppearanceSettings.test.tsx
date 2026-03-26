import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { AppearanceSettings } from '../AppearanceSettings';
import { ToastProvider } from '../../../../../components/common/Toast';

const mutateAsyncMock = vi.fn();
vi.mock('../../../../../hooks/useApi', () => ({
  useAddImage: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}));

vi.mock('../../../../../components/common/dropdown/AdvancedDropdown', () => ({
  __esModule: true,
  default: ({
    id,
    options,
    value,
    onChange,
  }: {
    id?: string;
    options: Array<{ label: string; value: string }>;
    value?: string;
    onChange: (value: string | string[]) => void;
  }) => (
    <select
      data-testid={id || 'advanced-dropdown'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
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
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

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
    mutateAsyncMock.mockResolvedValue({ data: { url: 'https://example.com/image.png' } });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
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

    it('should call onChange when text color changes', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const allInputs = document.querySelectorAll('input[type="color"]');
      fireEvent.change(allInputs[1], { target: { value: '#00ff00' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ textColor: '#00ff00' })
      );
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

    it('shows validation error for invalid logo URL', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getAllByText('Insert via URL')[0]);
      const input = screen.getByPlaceholderText('https://...');
      fireEvent.change(input, { target: { value: 'notaurl' } });

      expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    });

    it('accepts valid logo URL and calls onChange', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getAllByText('Insert via URL')[0]);
      const input = screen.getByPlaceholderText('https://...');
      fireEvent.change(input, { target: { value: 'https://example.com/logo.png' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://example.com/logo.png' })
      );
    });

    it('shows validation error for invalid banner URL', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const urlButtons = screen.getAllByText('Insert via URL');
      const bannerButton = urlButtons[urlButtons.length - 1];
      fireEvent.click(bannerButton);
      const inputs = screen.getAllByPlaceholderText('https://...');
      const bannerInput = inputs[inputs.length - 1];
      fireEvent.change(bannerInput, { target: { value: 'bad-url' } });

      expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    });

    it('hides logo URL input when logo URL looks like an uploaded file', () => {
      render(
        <AppearanceSettings
          appearance={{ ...defaultAppearance, logoUrl: 'http://localhost/assets/logo.png' }}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const urlButtons = screen.getAllByText('Insert via URL');
      expect(urlButtons.length).toBe(1);
    });

    it('hides banner URL input when banner URL looks like an uploaded file', () => {
      render(
        <AppearanceSettings
          appearance={{ ...defaultAppearance, bannerUrl: 'http://localhost/assets/banner.png' }}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const urlButtons = screen.getAllByText('Insert via URL');
      expect(urlButtons.length).toBe(1);
    });
  });

  describe('Image upload flows', () => {
    it('uploads logo image and calls mutation', async () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const fileInputs = document.querySelectorAll('input[type="file"]');
      fireEvent.change(fileInputs[0], { target: { files: [file] } });

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalledWith({ files: [file] });
      });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://example.com/image.png' })
      );
    });

    it('rejects non-image upload file', async () => {
      const file = new File(['text'], 'readme.txt', { type: 'text/plain' });
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const fileInputs = document.querySelectorAll('input[type="file"]');
      fireEvent.change(fileInputs[0], { target: { files: [file] } });

      await waitFor(() => {
        expect(mutateAsyncMock).not.toHaveBeenCalled();
      });
    });

    it('handles mutation upload error', async () => {
      mutateAsyncMock.mockRejectedValueOnce(new Error('upload failed'));
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const fileInputs = document.querySelectorAll('input[type="file"]');
      fireEvent.change(fileInputs[0], { target: { files: [file] } });

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });
    });
  });

  describe('Preview actions and dropdown changes', () => {
    it('removes existing logo from preview action', () => {
      render(
        <AppearanceSettings
          appearance={{ ...defaultAppearance, logoUrl: 'https://example.com/logo.png' }}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const removeButton = screen.getByRole('button', { name: 'Remove logo' });
      fireEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ logoUrl: '' }));
    });

    it('removes existing banner from preview action', () => {
      render(
        <AppearanceSettings
          appearance={{ ...defaultAppearance, bannerUrl: 'https://example.com/banner.png' }}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      const removeButton = screen.getByRole('button', { name: 'Remove banner' });
      fireEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ bannerUrl: '' }));
    });

    it('updates layout and appearance dropdown fields', () => {
      render(
        <AppearanceSettings
          appearance={defaultAppearance}
          onChange={mockOnChange}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.change(screen.getByTestId('layout-width-label'), { target: { value: 'full' } });
      fireEvent.change(screen.getByTestId('title-alignment-label'), { target: { value: 'center' } });
      fireEvent.change(screen.getByTestId('label-position-label'), { target: { value: 'left' } });
      fireEvent.change(screen.getByTestId('field-layout-label'), { target: { value: 'grid-2' } });
      fireEvent.change(screen.getByTestId('card-style-label'), { target: { value: 'elevated' } });
      fireEvent.change(screen.getByTestId('rounded-corners-label'), { target: { value: 'xl' } });

      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ layoutWidth: 'full' }));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ align: 'center' }));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ labelPosition: 'left' }));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ fieldLayout: 'grid-2' }));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ cardStyle: 'elevated' }));
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ rounded: 'xl' }));
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
