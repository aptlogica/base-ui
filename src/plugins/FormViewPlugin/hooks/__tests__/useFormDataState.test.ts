import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormDataState } from '../useFormDataState';

describe('useFormDataState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return empty rowData initially', () => {
      const { result } = renderHook(() => useFormDataState());

      expect(result.current.rowData).toEqual({});
    });

    it('should return null formError initially', () => {
      const { result } = renderHook(() => useFormDataState());

      expect(result.current.formError).toBeNull();
    });

    it('should return false for submitting initially', () => {
      const { result } = renderHook(() => useFormDataState());

      expect(result.current.submitting).toBe(false);
    });

    it('should return false for submitSuccess initially', () => {
      const { result } = renderHook(() => useFormDataState());

      expect(result.current.submitSuccess).toBe(false);
    });
  });

  describe('handleRowDataChange', () => {
    it('should update rowData when handleRowDataChange is called', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.handleRowDataChange('field1', 'value1');
      });

      expect(result.current.rowData).toEqual({ field1: 'value1' });
    });

    it('should merge multiple field updates into rowData', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.handleRowDataChange('field1', 'value1');
      });
      act(() => {
        result.current.handleRowDataChange('field2', 42);
      });

      expect(result.current.rowData).toEqual({ field1: 'value1', field2: 42 });
    });

    it('should overwrite existing field value when same fieldId is used', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.handleRowDataChange('field1', 'first');
      });
      act(() => {
        result.current.handleRowDataChange('field1', 'second');
      });

      expect(result.current.rowData).toEqual({ field1: 'second' });
    });
  });

  describe('clearFormData', () => {
    it('should reset rowData to empty object', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.handleRowDataChange('field1', 'value1');
      });
      act(() => {
        result.current.clearFormData();
      });

      expect(result.current.rowData).toEqual({});
    });

    it('should reset formError to null', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.setFormError('Some error');
      });
      act(() => {
        result.current.clearFormData();
      });

      expect(result.current.formError).toBeNull();
    });

    it('should reset submitSuccess to false', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.setSubmitSuccess(true);
      });
      act(() => {
        result.current.clearFormData();
      });

      expect(result.current.submitSuccess).toBe(false);
    });
  });

  describe('setFormError', () => {
    it('should set formError when setFormError is called', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.setFormError('Validation failed');
      });

      expect(result.current.formError).toBe('Validation failed');
    });
  });

  describe('setSubmitting', () => {
    it('should set submitting to true when setSubmitting is called with true', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.setSubmitting(true);
      });

      expect(result.current.submitting).toBe(true);
    });
  });

  describe('setSubmitSuccess', () => {
    it('should set submitSuccess to true when setSubmitSuccess is called', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.setSubmitSuccess(true);
      });

      expect(result.current.submitSuccess).toBe(true);
    });
  });

  describe('resetSuccess', () => {
    it('should reset submitSuccess and rowData when resetSuccess is called', () => {
      const { result } = renderHook(() => useFormDataState());

      act(() => {
        result.current.handleRowDataChange('field1', 'value1');
        result.current.setSubmitSuccess(true);
      });
      act(() => {
        result.current.resetSuccess();
      });

      expect(result.current.submitSuccess).toBe(false);
      expect(result.current.rowData).toEqual({});
    });
  });
});
