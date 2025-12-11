import { useState, useCallback } from 'react';

export function useFormPanel() {
  // Panel state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Open sidebar
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // Back to fields list (clear selection)
  const handleBackToFieldsList = useCallback(() => {
    setSelectedFieldId(null);
  }, []);

  return {
    // State
    sidebarOpen,
    selectedFieldId,
    
    // Setters
    setSidebarOpen,
    setSelectedFieldId,
    
    // Handlers
    toggleSidebar,
    closeSidebar,
    openSidebar,
    handleBackToFieldsList,
  };
}

