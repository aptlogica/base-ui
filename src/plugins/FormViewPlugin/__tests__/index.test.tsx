import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useFormData } from '../hooks/useFormData';
import FormViewPlugin from '../index';
import type { PluginAPI } from '../../../core/types';

vi.mock('../hooks/useFormData', () => ({
  useFormData: vi.fn(),
}));

vi.mock('../components/FormView', () => ({
  FormView: () => <div data-testid="form-view">FormView</div>,
}));

vi.mock('../../components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading</div>,
}));

const mockUseFormData = vi.mocked(useFormData);

type MockMutation = { mutateAsync: ReturnType<typeof vi.fn> };

const createMockFormDataReturn = (overrides: Partial<ReturnType<typeof useFormData>> = {}) => ({
  tableData: undefined,
  isLoading: false,
  error: null,
  refresh: vi.fn(),
  addRow: { mutateAsync: vi.fn() } as unknown as MockMutation,
  insertRowData: { mutateAsync: vi.fn() } as unknown as MockMutation,
  deleteRecord: { mutateAsync: vi.fn() } as unknown as MockMutation,
  updateField: { mutateAsync: vi.fn() } as unknown as MockMutation,
  deleteColumn: { mutateAsync: vi.fn() } as unknown as MockMutation,
  createField: { mutateAsync: vi.fn() } as unknown as MockMutation,
  updateView: { mutateAsync: vi.fn() } as unknown as MockMutation,
  submitForm: vi.fn(),
  createNewField: vi.fn(),
  updateFieldData: vi.fn(),
  toggleFieldVisibility: vi.fn(),
  setAllFieldsVisibility: vi.fn(),
  updateFieldOrder: vi.fn(),
  updateAppearance: vi.fn(),
  deleteFieldData: vi.fn(),
  ...overrides,
} as ReturnType<typeof useFormData>);

describe('FormViewPlugin', () => {
  const mockRegisterExtension = vi.fn();

  const mockApi: PluginAPI = {
    registerExtensionPoint: vi.fn(),
    registerExtension: mockRegisterExtension,
    getPlugin: vi.fn(),
    getPluginConfig: vi.fn(),
    getService: vi.fn(),
    registerService: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('manifest', () => {
    it('should expose plugin manifest with correct id', () => {
      expect(FormViewPlugin.manifest.id).toBe('form-view-plugin');
    });

    it('should expose plugin manifest with correct name', () => {
      expect(FormViewPlugin.manifest.name).toBe('Form View Plugin');
    });

    it('should expose plugin manifest with version', () => {
      expect(FormViewPlugin.manifest.version).toBe('2.0.0');
    });

    it('should expose plugin manifest with description', () => {
      expect(FormViewPlugin.manifest.description).toBeDefined();
      expect(typeof FormViewPlugin.manifest.description).toBe('string');
    });
  });

  describe('initialize', () => {
    it('should register view extension on initialize', async () => {
      await FormViewPlugin.initialize(mockApi);

      expect(mockRegisterExtension).toHaveBeenCalledTimes(1);
      expect(mockRegisterExtension).toHaveBeenCalledWith('view', expect.any(Object));
    });

    it('should register extension with id form-view', async () => {
      await FormViewPlugin.initialize(mockApi);

      const call = mockRegisterExtension.mock.calls[0];
      const extension = call[1];
      expect(extension.id).toBe('form-view');
    });

    it('should register extension with order 52', async () => {
      await FormViewPlugin.initialize(mockApi);

      const call = mockRegisterExtension.mock.calls[0];
      const extension = call[1];
      expect(extension.order).toBe(52);
    });

    it('should register extension with render function', async () => {
      await FormViewPlugin.initialize(mockApi);

      const call = mockRegisterExtension.mock.calls[0];
      const extension = call[1];
      expect(typeof extension.render).toBe('function');
    });
  });

  describe('extension render', () => {
    it('should return null when table id is missing', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn());

      await FormViewPlugin.initialize(mockApi);
      const extension = mockRegisterExtension.mock.calls[0][1];
      const result = extension.render({ viewType: 'form' });
      expect(result).toBeNull();
    });

    it('should return null when view type does not match form', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn());

      await FormViewPlugin.initialize(mockApi);
      const extension = mockRegisterExtension.mock.calls[0][1];
      const result = extension.render({ table: { id: 't1' }, viewType: 'grid' });
      expect(result).toBeNull();
    });

    it('should render loading state when isLoading is true', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn({ isLoading: true }));

      let extension: { render: (p: unknown) => React.ReactNode };
      mockRegisterExtension.mockImplementation((_pointId: string, ext: typeof extension) => {
        extension = ext;
      });
      await FormViewPlugin.initialize(mockApi);
      const element = extension!.render({
        table: { id: 't1' },
        view: { id: 'v1', type: 'form' },
      });
      render(<>{element}</>);

      expect(screen.getByText(/Loading form/)).toBeInTheDocument();
    });

    it('should render error state when error is set', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn({ error: new Error('Network failed') }));

      let extension: { render: (p: unknown) => React.ReactNode };
      mockRegisterExtension.mockImplementation((_pointId: string, ext: typeof extension) => {
        extension = ext;
      });
      await FormViewPlugin.initialize(mockApi);
      const element = extension!.render({
        table: { id: 't1' },
        view: { id: 'v1', type: 'form' },
      });
      render(<>{element}</>);

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByText('Network failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('should render error message when error is string', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn({ error: 'Server error' }));

      let extension: { render: (p: unknown) => React.ReactNode };
      mockRegisterExtension.mockImplementation((_pointId: string, ext: typeof extension) => {
        extension = ext;
      });
      await FormViewPlugin.initialize(mockApi);
      const element = extension!.render({
        table: { id: 't1' },
        view: { id: 'v1', type: 'form' },
      });
      render(<>{element}</>);

      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('should render no form data state when tableData has no model', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn({
        tableData: { columns: [] } as unknown as ReturnType<typeof useFormData>['tableData'],
      }));

      let extension: { render: (p: unknown) => React.ReactNode };
      mockRegisterExtension.mockImplementation((_pointId: string, ext: typeof extension) => {
        extension = ext;
      });
      await FormViewPlugin.initialize(mockApi);
      const element = extension!.render({
        table: { id: 't1' },
        view: { id: 'v1', type: 'form' },
      });
      render(<>{element}</>);

      expect(screen.getByText(/No form data/)).toBeInTheDocument();
      expect(screen.getByText(/Form could not be loaded/)).toBeInTheDocument();
    });

    it('should accept view type from props.view.type', async () => {
      mockUseFormData.mockReturnValue(createMockFormDataReturn({
        tableData: {
          model: { id: 'm1' },
          columns: [],
          views: [{ id: 'v1' }],
          records: [],
        } as unknown as ReturnType<typeof useFormData>['tableData'],
      }));

      let extension: { render: (p: unknown) => React.ReactNode };
      mockRegisterExtension.mockImplementation((_pointId: string, ext: typeof extension) => {
        extension = ext;
      });
      await FormViewPlugin.initialize(mockApi);
      const element = extension!.render({
        table: { id: 't1' },
        view: { id: 'v1', type: 'form-view' },
      });
      render(<>{element}</>);

      await waitFor(() => {
        expect(mockUseFormData).toHaveBeenCalledWith(
          expect.objectContaining({ tableId: 't1', viewId: 'v1' })
        );
      });
    });
  });
});
