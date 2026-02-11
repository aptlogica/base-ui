import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormViewConfig } from '../useFormViewConfig';

vi.mock('../../../../components/common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
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
