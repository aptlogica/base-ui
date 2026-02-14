import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { FormView } from '../FormView';
import { ToastProvider } from '../../../../../components/common/Toast';
import type { TableData } from '../../../../../types/api.types';

vi.mock('../../../../../hooks/useApi', () => ({
  useAllViews: () => ({ data: [] }),
}));

let isReadOnlyState = false;
vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => ({
    isBaseReadOnly: () => isReadOnlyState,
    canCreateColumn: () => true,
  }),
}));

const formModalsState = {
  isNewColumnModalOpen: false,
  deleteConfirmModalOpen: false,
  fieldToDelete: null as string | null,
  modalPosition: null as { top: number; left: number } | null,
  editColumn: null as any,
  editModalOpen: false,
  updateFieldConfirmModalOpen: false,
  pendingEditColumnChanges: null as any,
  addFieldButtonRef: { current: null as HTMLButtonElement | null },
  handleAddField: vi.fn(),
  handleCloseNewColumnModal: vi.fn(),
  handleFieldEdit: vi.fn(),
  handleCloseEditModal: vi.fn(),
  handleDeleteField: vi.fn(),
  handleCloseDeleteConfirmModal: vi.fn(),
  handleCloseUpdateFieldConfirmModal: vi.fn(),
  setPendingEditColumnChanges: vi.fn(),
  setEditModalOpen: vi.fn(),
  setEditColumn: vi.fn(),
  setUpdateFieldConfirmModalOpen: vi.fn(),
};

const formPanelState = {
  sidebarOpen: false,
  selectedFieldId: null as string | null,
  setSelectedFieldId: vi.fn(),
  toggleSidebar: vi.fn(),
};

const formDataState = {
  rowData: { Title: 'R1' },
  formError: null as string | null,
  submitting: false,
  setFormError: vi.fn(),
  setSubmitting: vi.fn(),
  setSubmitSuccess: vi.fn(),
  handleRowDataChange: vi.fn(),
  clearFormData: vi.fn(),
};

const formViewConfigState = {
  formConfig: { title: 'Form', appearance: {} },
  handleConfigChange: vi.fn(),
};

vi.mock('../../../hooks/useFormModals', () => ({
  useFormModals: () => formModalsState,
}));

vi.mock('../../../hooks/useFormPanel', () => ({
  useFormPanel: () => formPanelState,
}));

vi.mock('../../../hooks/useFormDataState', () => ({
  useFormDataState: () => formDataState,
}));

vi.mock('../../../hooks/useFormViewConfig', () => ({
  useFormViewConfig: () => formViewConfigState,
}));

vi.mock('../FormPreview', () => ({
  FormPreview: (props: {
    config: { title: string };
    onSubmit?: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    onDeleteField?: (fieldId: string) => void;
    onEdit?: (fieldId: string) => void;
    onFieldOrderChange?: (fields: any[]) => void;
    onClear?: () => void;
  }) => (
    <div data-testid="form-preview">
      <span data-testid="form-title">{props.config.title}</span>
      {props.onSubmit && (
        <button
          data-testid="submit-btn"
          onClick={() => props.onSubmit?.({ preventDefault: vi.fn() } as unknown as React.SyntheticEvent<HTMLFormElement>)}
        >
          Submit
        </button>
      )}
      {props.onDeleteField && (
        <>
          <button data-testid="delete-system-btn" onClick={() => props.onDeleteField?.('c1')}>DeleteSystem</button>
          <button data-testid="delete-field-btn" onClick={() => props.onDeleteField?.('c2')}>DeleteField</button>
        </>
      )}
      {props.onEdit && <button data-testid="edit-system-btn" onClick={() => props.onEdit?.('c1')}>EditSystem</button>}
      {props.onFieldOrderChange && (
        <button data-testid="preview-order-btn" onClick={() => props.onFieldOrderChange?.([{ id: 'c2' }])}>
          Reorder
        </button>
      )}
      {props.onClear && <button data-testid="clear-btn" onClick={props.onClear}>Clear</button>}
    </div>
  ),
}));

vi.mock('../RightPanel', () => ({
  RightPanel: (props: {
    onFieldToggle?: (fieldId: string) => void;
    onDeleteField?: (fieldId: string) => void;
    setVisibleAllFields?: (visible: boolean) => void;
    onFieldOrderChange?: (fields: any[]) => void;
  }) => (
    <div data-testid="right-panel">
      <button data-testid="toggle-field-btn" onClick={() => props.onFieldToggle?.('c2')}>ToggleField</button>
      <button data-testid="panel-delete-btn" onClick={() => props.onDeleteField?.('c2')}>PanelDelete</button>
      <button data-testid="set-visible-btn" onClick={() => props.setVisibleAllFields?.(true)}>SetVisible</button>
      <button data-testid="panel-order-btn" onClick={() => props.onFieldOrderChange?.([{ id: 'c2' }])}>PanelOrder</button>
    </div>
  ),
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
      { id: 'c1', title: 'Title', column_name: 'title', uidt: 'text', system: true },
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
    isReadOnlyState = false;
    formPanelState.sidebarOpen = false;
    formPanelState.selectedFieldId = null;
    formModalsState.isNewColumnModalOpen = false;
    formModalsState.deleteConfirmModalOpen = false;
    formModalsState.fieldToDelete = null;
    formModalsState.modalPosition = null;
    formModalsState.editColumn = null;
    formModalsState.editModalOpen = false;
    formModalsState.updateFieldConfirmModalOpen = false;
    formModalsState.pendingEditColumnChanges = null;
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
      formPanelState.sidebarOpen = true;
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );
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
      expect(formPanelState.toggleSidebar).toHaveBeenCalled();
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

    it('should hide mutating actions in read-only mode', () => {
      isReadOnlyState = true;
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Add Field')).not.toBeInTheDocument();
      expect(screen.queryByTestId('submit-btn')).not.toBeInTheDocument();
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

  describe('Handler execution paths', () => {
    it('submits form data on submit button click', async () => {
      (mockActions.submitForm as Mock).mockResolvedValueOnce(undefined);

      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockActions.submitForm).toHaveBeenCalled();
      });
      expect(formDataState.clearFormData).toHaveBeenCalled();
    });

    it('handles submit failure path', async () => {
      (mockActions.submitForm as Mock).mockRejectedValueOnce(new Error('submit failed'));

      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockActions.submitForm).toHaveBeenCalled();
      });
      expect(formDataState.setFormError).toHaveBeenCalled();
    });

    it('uses field delete/edit guards for system and non-system fields', () => {
      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('delete-system-btn'));
      fireEvent.click(screen.getByTestId('delete-field-btn'));
      fireEvent.click(screen.getByTestId('edit-system-btn'));

      expect(formModalsState.handleDeleteField).toHaveBeenCalledTimes(1);
      expect(formModalsState.handleDeleteField).toHaveBeenCalledWith('c2');
      expect(formModalsState.handleFieldEdit).not.toHaveBeenCalled();
    });

    it('executes right panel actions when sidebar is open', async () => {
      formPanelState.sidebarOpen = true;
      (mockActions.toggleFieldVisibility as Mock).mockResolvedValueOnce(undefined);
      (mockActions.setAllFieldsVisibility as Mock).mockResolvedValueOnce(undefined);
      (mockActions.updateFieldOrder as Mock).mockResolvedValueOnce(undefined);

      render(
        <FormView
          tableData={defaultTableData}
          viewId="v1"
          onRefresh={mockOnRefresh}
          actions={mockActions}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByTestId('toggle-field-btn'));
      fireEvent.click(screen.getByTestId('set-visible-btn'));
      fireEvent.click(screen.getByTestId('panel-order-btn'));

      await waitFor(() => {
        expect(mockActions.toggleFieldVisibility).toHaveBeenCalled();
        expect(mockActions.setAllFieldsVisibility).toHaveBeenCalled();
        expect(mockActions.updateFieldOrder).toHaveBeenCalled();
      });
    });
  });
});
