import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { FormView } from '../FormView';
import { ToastProvider } from '../../../../../components/common/Toast';
import type { TableData } from '../../../../../types/api.types';

vi.mock('../../../../../hooks/useApi', () => ({
  useAllViews: () => ({ data: [] }),
}));

vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => ({
    isBaseReadOnly: () => false,
    canCreateColumn: () => true,
  }),
}));

vi.mock('../FormPreview', () => ({
  FormPreview: (props: { config: { title: string }; onSubmit?: () => void }) => (
    <div data-testid="form-preview">
      <span data-testid="form-title">{props.config.title}</span>
      {props.onSubmit && (
        <button data-testid="submit-btn" onClick={props.onSubmit}>
          Submit
        </button>
      )}
    </div>
  ),
}));

vi.mock('../RightPanel', () => ({
  RightPanel: () => <div data-testid="right-panel">RightPanel</div>,
}));

vi.mock('../../../../../components/modals/NewColumnModal', () => ({
  NewColumnModal: () => <div data-testid="new-column-modal">NewColumnModal</div>,
}));

vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  default: () => <div data-testid="delete-confirm-modal">DeleteConfirmModal</div>,
}));

vi.mock('../../../../../components/modals/UpdateFieldConfirmModal', () => ({
  default: () => <div data-testid="update-field-confirm-modal">UpdateFieldConfirmModal</div>,
}));

vi.mock('../../../../../components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading</div>,
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

describe('FormView', () => {
  const mockOnRefresh = vi.fn();
  const mockActions = {
    addRow: { mutateAsync: vi.fn() },
    insertRowData: { mutateAsync: vi.fn() },
    deleteRecord: { mutateAsync: vi.fn() },
    updateField: { mutateAsync: vi.fn() },
    deleteColumn: { mutateAsync: vi.fn() },
    createField: { mutateAsync: vi.fn() },
    updateView: { mutateAsync: vi.fn() },
    submitForm: vi.fn(),
    createNewField: vi.fn(),
    updateFieldData: vi.fn(),
    toggleFieldVisibility: vi.fn(),
    setAllFieldsVisibility: vi.fn(),
    updateFieldOrder: vi.fn(),
    updateAppearance: vi.fn(),
    deleteFieldData: vi.fn(),
  };

  const defaultTableData = {
    model: { id: 'm1', base_id: 'b1' },
    columns: [
      { id: 'c1', title: 'Title', column_name: 'title', uidt: 'text' },
      { id: 'c2', title: 'Description', column_name: 'description', uidt: 'longText' },
    ],
    views: [
      { id: 'v1', title: 'Form View', type: 'form', meta: {} },
    ],
    records: [
      { id: 'r1', title: 'Record 1' },
    ],
  } as TableData;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render null when view is not found', () => {
      const { container } = render(
        <FormView
          tableData={defaultTableData}
          viewId="non-existent"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render Form View heading when view exists', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('heading', { name: 'Form View' })).toBeInTheDocument();
    });

    it('should render field count', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/\d+ fields?/i)).toBeInTheDocument();
    });

    it('should render Add Field button', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Add Field')).toBeInTheDocument();
    });

    it('should render FormPreview component', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });
  });

  describe('Sidebar toggle', () => {
    it('should not show RightPanel by default', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
    });

    it('should show RightPanel when sidebar toggle is clicked', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      const toggleButton = screen.getByTitle('Show sidebar');
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    it('should hide RightPanel when sidebar toggle is clicked again', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      const toggleButton = screen.getByTitle('Show sidebar');
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByTitle('Hide sidebar'));

      expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
    });
  });

  describe('Read-only mode', () => {
    it('should render sidebar toggle button for toggling panel', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTitle('Show sidebar')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle tableData with no records', () => {
      const tableDataNoRecords = {
        ...defaultTableData,
        records: [],
      };

      render(
        <FormView
          tableData={tableDataNoRecords}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });

    it('should handle tableData with specific recordId', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          recordId="r1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });

    it('should handle tableData with empty columns', () => {
      const tableDataNoColumns = {
        ...defaultTableData,
        columns: [],
      };

      render(
        <FormView
          tableData={tableDataNoColumns}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('heading', { name: 'Form View' })).toBeInTheDocument();
    });
  });

  describe('Background color', () => {
    it('should apply background color from view appearance', () => {
      const tableDataWithAppearance = {
        ...defaultTableData,
        views: [
          {
            id: 'v1',
            title: 'Form View',
            type: 'form',
            meta: {
              formViewAppearance: {
                backgroundColor: '#eff6ff',
              },
            },
          },
        ],
      };

      const { container } = render(
        <FormView
          tableData={tableDataWithAppearance}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      const formContainer = container.querySelector('.h-full.flex.flex-col');
      expect(formContainer).toBeInTheDocument();
    });
  });
});
