import { useState, useEffect, useCallback } from 'react';

export function useTableModals() {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ open: boolean, x: number, y: number, rowId: string | null }>({ 
    open: false, 
    x: 0, 
    y: 0, 
    rowId: null 
  });

  // Column context menu state
  const [colMenu, setColMenu] = useState<{ open: boolean, x: number, y: number, colIndex: number | null }>({ 
    open: false, 
    x: 0, 
    y: 0, 
    colIndex: null 
  });

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, rowId: string) => {
    // Prevent context menu from showing if clicked inside a modal or other overlay
    const target = e.target as HTMLElement;
    const isInModal = target.closest('[class*="z-50"]') || 
                      target.closest('[class*="modal"]') ||
                      target.closest('[role="dialog"]') ||
                      target.closest('.fixed.inset-0');
    
    if (isInModal) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, rowId });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  // Column context menu handler
  const handleColContextMenu = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setColMenu({ open: true, x: e.clientX, y: e.clientY, colIndex });
  }, []);

  const handleCloseColMenu = useCallback(() => {
    setColMenu(prev => ({ ...prev, open: false }));
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.open) {
        handleCloseContextMenu();
      }
    };

    // Prevent context menu from appearing when right-clicking inside modals
    const handleDocumentContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInModal = target.closest('[class*="z-50"]') || 
                        target.closest('[class*="modal"]') ||
                        target.closest('[role="dialog"]') ||
                        target.closest('.fixed.inset-0.z-50');
      
      if (isInModal) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (contextMenu.open) {
      document.addEventListener('click', handleClickOutside);
    }

    // Always listen for context menu events to prevent them in modals
    document.addEventListener('contextmenu', handleDocumentContextMenu, true);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleDocumentContextMenu, true);
    };
  }, [contextMenu.open, handleCloseContextMenu]);

  return {
    // Context menu
    contextMenu,
    handleContextMenu,
    handleCloseContextMenu,
    colMenu,
    handleColContextMenu,
    handleCloseColMenu,
  };
}

