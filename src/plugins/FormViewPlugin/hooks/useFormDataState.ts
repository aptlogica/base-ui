import { useState, useCallback } from 'react';

export function useFormDataState() {
  // Form data state
  const [rowData, setRowData] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle row data change
  const handleRowDataChange = useCallback((fieldId: string, value: unknown) => {
    setRowData(prev => {
      const newData = { ...prev, [fieldId]: value };
      return newData;
    });
  }, []);

  // Clear form data
  const clearFormData = useCallback(() => {
    setFormError(null);
    setRowData({});
    setSubmitSuccess(false);
  }, []);

  // Reset success state
  const resetSuccess = useCallback(() => {
    setSubmitSuccess(false);
    setRowData({});
  }, []);

  return {
    // State
    rowData,
    formError,
    submitting,
    submitSuccess,
    
    // Setters
    setRowData,
    setFormError,
    setSubmitting,
    setSubmitSuccess,
    
    // Handlers
    handleRowDataChange,
    clearFormData,
    resetSuccess,
  };
}

