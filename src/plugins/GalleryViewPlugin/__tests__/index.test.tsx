import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import GalleryViewPlugin from '../index';
import type { PluginAPI } from '../../../core/types';
import * as useGalleryDataModule from '../hooks/useGalleryData';

// Mock the modules
vi.mock('../hooks/useGalleryData', () => ({
  useGalleryData: vi.fn(),
}));

vi.mock('../components/GalleryView', () => ({
  GalleryView: vi.fn(() => <div data-testid="gallery-view">Gallery View</div>),
}));

vi.mock('../../../components/ui/Loader', () => ({
  Loader: vi.fn(() => <div data-testid="loader">Loading...</div>),
}));

describe('GalleryViewPlugin', () => {
  let mockApi: PluginAPI;
  const mockUseGalleryData = vi.mocked(useGalleryDataModule.useGalleryData);

  const defaultMockReturn = {
    tableData: { model: { id: 'table-1' }, columns: [], records: [], views: [] },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    addRow: vi.fn(),
    insertRowData: vi.fn(),
    deleteRecord: vi.fn(),
    updateField: vi.fn(),
    updateView: vi.fn(),
    updateViewConfig: vi.fn(),
    galleryItems: [],
    attachmentField: undefined,
    attachmentFields: [],
    columns: [],
    view: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = {
      registerExtension: vi.fn(),
      registerComponent: vi.fn(),
      registerService: vi.fn(),
      getService: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as PluginAPI;

    mockUseGalleryData.mockReturnValue(defaultMockReturn as any);
  });

  afterEach(() => {
    cleanup();
  });

  describe('manifest', () => {
    it('should have correct plugin id', () => {
      expect(GalleryViewPlugin.manifest.id).toBe('gallery-view-plugin');
    });

    it('should have correct plugin name', () => {
      expect(GalleryViewPlugin.manifest.name).toBe('Gallery View Plugin');
    });

    it('should have correct version', () => {
      expect(GalleryViewPlugin.manifest.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(GalleryViewPlugin.manifest.description).toBe('Gallery view for displaying records with attachment fields in a card-based layout');
    });
  });

  describe('initialize', () => {
    it('should call registerExtension with view type', async () => {
      await GalleryViewPlugin.initialize(mockApi, {});

      expect(mockApi.registerExtension).toHaveBeenCalledWith('view', expect.objectContaining({
        id: 'gallery-view',
        order: 60,
        render: expect.any(Function)
      }));
    });

    it('should register extension with correct order', async () => {
      await GalleryViewPlugin.initialize(mockApi, {});

      const callArgs = vi.mocked(mockApi.registerExtension).mock.calls[0];
      expect(callArgs[1]).toMatchObject({ order: 60 });
    });
  });

  describe('render function', () => {
    let renderFn: (props: any) => React.ReactElement | null;

    beforeEach(async () => {
      await GalleryViewPlugin.initialize(mockApi, {});
      const callArgs = vi.mocked(mockApi.registerExtension).mock.calls[0];
      renderFn = callArgs[1].render;
    });

    it('should return null when tableId is missing', () => {
      const result = renderFn({ table: {} });

      expect(result).toBeNull();
    });

    it('should return null when viewType does not match', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'grid' 
      });

      expect(result).toBeNull();
    });

    it('should render when viewType is gallery', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      expect(result).not.toBeNull();
    });

    it('should render when viewType is galleryview', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'galleryview' 
      });

      expect(result).not.toBeNull();
    });

    it('should render when viewType is gallery-view', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery-view' 
      });

      expect(result).not.toBeNull();
    });

    it('should render when viewType is gallery_view', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery_view' 
      });

      expect(result).not.toBeNull();
    });

    it('should render when viewType comes from view.type', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        view: { id: 'view-1', type: 'gallery' }
      });

      expect(result).not.toBeNull();
    });
  });

  describe('GalleryViewComponent', () => {
    let renderFn: (props: any) => React.ReactElement | null;

    beforeEach(async () => {
      await GalleryViewPlugin.initialize(mockApi, {});
      const callArgs = vi.mocked(mockApi.registerExtension).mock.calls[0];
      renderFn = callArgs[1].render;
    });

    it('should show loader when loading', () => {
      mockUseGalleryData.mockReturnValue({
        ...defaultMockReturn,
        tableData: undefined,
        isLoading: true,
      });

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should show loader when model is missing', () => {
      mockUseGalleryData.mockReturnValue({
        ...defaultMockReturn,
        tableData: { model: null, columns: [], records: [], views: [] } as any,
        isLoading: false,
      });

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should show error message when error occurs', () => {
      mockUseGalleryData.mockReturnValue({
        ...defaultMockReturn,
        tableData: undefined,
        isLoading: false,
        error: new Error('Failed to load data'),
      });

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(screen.getByText('Something went wrong while loading the gallery view.')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should show error message for non-Error error', () => {
      mockUseGalleryData.mockReturnValue({
        ...defaultMockReturn,
        tableData: undefined,
        isLoading: false,
        error: 'String error',
      });

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(screen.getByText('String error')).toBeInTheDocument();
    });

    it('should call refresh when retry button is clicked', async () => {
      const mockRefresh = vi.fn();
      mockUseGalleryData.mockReturnValue({
        ...defaultMockReturn,
        tableData: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refresh: mockRefresh,
      });

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      const retryButton = screen.getByText('Retry');
      retryButton.click();

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('should render GalleryView when data is loaded', () => {
      mockUseGalleryData.mockReturnValue(defaultMockReturn as any);

      const component = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(screen.getByTestId('gallery-view')).toBeInTheDocument();
    });

    it('should pass tableId to useGalleryData', () => {
      mockUseGalleryData.mockReturnValue(defaultMockReturn as any);

      const component = renderFn({ 
        table: { id: 'table-123' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(mockUseGalleryData).toHaveBeenCalledWith({
        tableId: 'table-123',
        viewId: undefined,
      });
    });

    it('should pass viewId to useGalleryData when provided', () => {
      mockUseGalleryData.mockReturnValue(defaultMockReturn as any);

      const component = renderFn({ 
        table: { id: 'table-123' },
        view: { id: 'view-456' },
        viewType: 'gallery' 
      });

      render(component as React.ReactElement);

      expect(mockUseGalleryData).toHaveBeenCalledWith({
        tableId: 'table-123',
        viewId: 'view-456',
      });
    });
  });

  describe('edge cases', () => {
    let renderFn: (props: any) => React.ReactElement | null;

    beforeEach(async () => {
      await GalleryViewPlugin.initialize(mockApi, {});
      const callArgs = vi.mocked(mockApi.registerExtension).mock.calls[0];
      renderFn = callArgs[1].render;
    });

    it('should handle null table prop', () => {
      const result = renderFn({ table: null });

      expect(result).toBeNull();
    });

    it('should handle undefined props', () => {
      const result = renderFn(undefined);

      expect(result).toBeNull();
    });

    it('should handle empty props object', () => {
      const result = renderFn({});

      expect(result).toBeNull();
    });

    it('should handle case-insensitive viewType matching', () => {
      const result = renderFn({ 
        table: { id: 'table-1' },
        viewType: 'GALLERY' 
      });

      expect(result).not.toBeNull();
    });
  });
});
