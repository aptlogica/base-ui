import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ToastProvider } from '../../../../../components/common/Toast';
import { RightPanel } from '../RightPanel';
import type { FormConfig, FormField } from '../../../../../types/form';

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

describe('RightPanel', () => {
  const mockFields: FormField[] = [
    {
      id: 'f1',
      name: 'Title',
      type: 'text',
      label: 'Title',
      title: 'Title',
    },
    {
      id: 'f2',
      name: 'Description',
      type: 'longText',
      label: 'Description',
      title: 'Description',
    },
  ];

  const mockConfig: FormConfig = {
    title: 'Form',
    description: '',
    fields: mockFields,
    appearance: {},
  };

  const mockOnFieldSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Form Fields heading', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText('Form Fields')).toBeInTheDocument();
    });

    it('should render Fields tab button', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByRole('button', { name: 'Fields' })).toBeInTheDocument();
    });

    it('should render Style tab button', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByRole('button', { name: /Style/ })).toBeInTheDocument();
    });

    it('should show Fields tab content by default', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('should switch to Style tab when Style button is clicked', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          onConfigChange={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const styleButton = screen.getByRole('button', { name: /Style/ });
      fireEvent.click(styleButton);

      expect(screen.queryByPlaceholderText('Search fields...')).not.toBeInTheDocument();
    });

    it('should switch back to Fields tab when Fields button is clicked after Style', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          onConfigChange={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByRole('button', { name: /Style/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Fields' }));

      expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
    });
  });

  describe('Read-only mode', () => {
    it('should show read-only message in Style tab when isReadOnly is true', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          isReadOnly={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Style/ }));

      expect(screen.getByText('Appearance settings are not available in read-only mode.')).toBeInTheDocument();
    });

    it('should disable field list actions when isReadOnly is true', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          isReadOnly={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });
      expect(selectAllCheckbox).toBeDisabled();
    });
  });

  describe('Field count display', () => {
    it('should display field count in header', () => {
      render(
        <RightPanel
          config={mockConfig}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText(/2\/\d+ Field/)).toBeInTheDocument();
    });
  });
});
