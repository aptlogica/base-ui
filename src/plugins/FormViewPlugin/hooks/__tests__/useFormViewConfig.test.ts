import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormViewConfig } from '../useFormViewConfig';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../../../components/common/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}));

describe('useFormViewConfig', () => {
  const mockUpdateAppearance = vi.fn();

  const defaultView = {
    id: 'v1',
    title: 'Test Form',
    description: 'Test description',
    meta: {},
    appearance: {},
  };

  const defaultFormFields = [
    { id: 'f1', name: 'Field 1', type: 'text', label: 'Field 1' },
    { id: 'f2', name: 'Field 2', type: 'number', label: 'Field 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize formConfig with view title', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.title).toBe('Test Form');
    });

    it('should initialize formConfig with view description', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.description).toBe('Test description');
    });

    it('should initialize formConfig with formFields', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.fields).toHaveLength(2);
      expect(result.current.formConfig.fields[0].id).toBe('f1');
    });

    it('should initialize with default appearance values', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.appearance?.backgroundColor).toBe('#f8fafc');
      expect(result.current.formConfig.appearance?.layoutWidth).toBe('medium');
      expect(result.current.formConfig.appearance?.fieldLayout).toBe('list');
    });

    it('should use persisted formViewAppearance when available', () => {
      const viewWithAppearance = {
        ...defaultView,
        meta: {
          formViewAppearance: {
            formTitle: 'Persisted Title',
            formDescription: 'Persisted Desc',
            backgroundColor: '#eff6ff',
          },
        },
      };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewWithAppearance,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.title).toBe('Persisted Title');
      expect(result.current.formConfig.description).toBe('Persisted Desc');
      expect(result.current.formConfig.appearance?.backgroundColor).toBe('#eff6ff');
    });
  });

  describe('handleConfigChange', () => {
    it('should update formConfig title immediately', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ title: 'New Title' });
      });

      expect(result.current.formConfig.title).toBe('New Title');
    });

    it('should update formConfig description immediately', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ description: 'New Desc' });
      });

      expect(result.current.formConfig.description).toBe('New Desc');
    });

    it('should update formConfig appearance immediately', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({
          appearance: { backgroundColor: '#ff0000' },
        });
      });

      expect(result.current.formConfig.appearance?.backgroundColor).toBe('#ff0000');
    });

    it('should debounce updateAppearance call', () => {
      mockUpdateAppearance.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ title: 'Updated Title' });
      });

      expect(mockUpdateAppearance).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(mockUpdateAppearance).toHaveBeenCalled();
    });

    it('should call updateAppearance even when merged appearance is unchanged', async () => {
      mockUpdateAppearance.mockResolvedValue(undefined);
      const viewWithAppearance = {
        ...defaultView,
        meta: {
          formViewAppearance: {
            formTitle: 'Test Form',
            formDescription: 'Test description',
            backgroundColor: '#f8fafc',
          },
        },
      };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewWithAppearance,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ title: 'Test Form' });
      });

      await act(async () => {
        vi.advanceTimersByTime(700);
      });

      expect(mockUpdateAppearance).toHaveBeenCalled();
    });

    it('should not call updateAppearance when view has no id', async () => {
      const viewWithoutId = { ...defaultView, id: undefined };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewWithoutId,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ title: 'Updated Title' });
      });

      await act(async () => {
        vi.advanceTimersByTime(700);
      });

      expect(mockUpdateAppearance).not.toHaveBeenCalled();
    });

    it('skips persistence when no fields are provided', async () => {
      mockUpdateAppearance.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({});
      });

      await act(async () => {
        vi.advanceTimersByTime(700);
      });

      expect(mockUpdateAppearance).not.toHaveBeenCalled();
    });

    it('shows error toast when updateAppearance fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateAppearance.mockRejectedValue(new Error('boom'));

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({ title: 'Changed Title' });
      });

      await act(async () => {
        vi.advanceTimersByTime(700);
      });

      expect(toastError).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('persists merged appearance and shows success toast', async () => {
      mockUpdateAppearance.mockResolvedValue(undefined);
      const viewWithMeta = {
        ...defaultView,
        meta: { formViewAppearance: { backgroundColor: '#f8fafc' } },
      };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewWithMeta,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      act(() => {
        result.current.handleConfigChange({
          title: 'Updated Title',
          description: 'Updated Desc',
          appearance: { primaryColor: '#111111' },
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(700);
      });

      expect(mockUpdateAppearance).toHaveBeenCalledWith(
        expect.objectContaining({
          formTitle: 'Updated Title',
          formDescription: 'Updated Desc',
          primaryColor: '#111111',
        }),
        viewWithMeta
      );
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  describe('setFormConfig', () => {
    it('should expose setFormConfig for direct updates', () => {
      const { result } = renderHook(() =>
        useFormViewConfig({
          view: defaultView,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(typeof result.current.setFormConfig).toBe('function');
    });
  });

  describe('fields synchronization', () => {
    it('should update formConfig.fields when formFields prop changes', () => {
      const { result, rerender } = renderHook(
        ({ formFields }) =>
          useFormViewConfig({
            view: defaultView,
            formFields,
            updateAppearance: mockUpdateAppearance,
          }),
        { initialProps: { formFields: defaultFormFields } }
      );

      expect(result.current.formConfig.fields).toHaveLength(2);

      const newFields = [
        { id: 'f1', name: 'Field 1', type: 'text', label: 'Field 1' },
        { id: 'f2', name: 'Field 2', type: 'number', label: 'Field 2' },
        { id: 'f3', name: 'Field 3', type: 'text', label: 'Field 3' },
      ];

      rerender({ formFields: newFields });

      expect(result.current.formConfig.fields).toHaveLength(3);
    });
  });

  describe('external appearance sync', () => {
    it('updates state when view meta formViewAppearance changes', () => {
      const { result, rerender } = renderHook(
        ({ view }) =>
          useFormViewConfig({
            view,
            formFields: defaultFormFields,
            updateAppearance: mockUpdateAppearance,
          }),
        { initialProps: { view: defaultView } }
      );

      const updatedView = {
        ...defaultView,
        meta: {
          formViewAppearance: {
            formTitle: 'Remote Title',
            formDescription: 'Remote Desc',
            backgroundColor: '#111111',
          },
        },
      };

      rerender({ view: updatedView });

      expect(result.current.formConfig.title).toBe('Remote Title');
      expect(result.current.formConfig.description).toBe('Remote Desc');
      expect(result.current.formConfig.appearance?.backgroundColor).toBe('#111111');
    });
  });

  describe('default values', () => {
    it('should use Form as default title when view has no title', () => {
      const viewNoTitle = { ...defaultView, title: undefined };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewNoTitle,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.title).toBe('Form');
    });

    it('should use empty string as default description when view has no description', () => {
      const viewNoDesc = { ...defaultView, description: undefined };

      const { result } = renderHook(() =>
        useFormViewConfig({
          view: viewNoDesc,
          formFields: defaultFormFields,
          updateAppearance: mockUpdateAppearance,
        })
      );

      expect(result.current.formConfig.description).toBe('');
    });
  });
});
