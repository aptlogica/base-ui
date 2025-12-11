import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../stores/navigationStore';
import { useWorkspaceDataService } from '../../plugins/WorkspacePlugin/data/workspaceDataService';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isClickable?: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId } = useNavigationStore();
  
  // Get data for breadcrumb items with error handling (hooks must be called unconditionally)
  const { workspaceByIdQuery, baseByIdQuery, tableByIdQuery, viewByIdQuery } = useWorkspaceDataService(
    selectedWorkspaceId || undefined,
    selectedBaseId || undefined,
    selectedTableId || undefined,
    selectedViewId || undefined
  );

  // Hide breadcrumbs on specific routes that have their own navigation
  // Check AFTER all hooks are called to avoid Rules of Hooks violation
  const pathname = location.pathname;
  const excludedRoutes = ['/administrator', '/workspace-settings'];
  if (excludedRoutes.some(route => pathname.includes(route))) {
    return null;
  }

  // Utility function to truncate text intelligently
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const currentWorkspace = workspaceByIdQuery.data?.data;
  const currentBase = baseByIdQuery.data?.data;
  const currentTable = tableByIdQuery.data?.data;
  const currentView = viewByIdQuery.data;

  // Build breadcrumb items based on current route path, not navigation state
  const buildBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const pathname = location.pathname;

    // Parse the current path to determine breadcrumb levels
    const pathParts = pathname.split('/').filter(Boolean);
    
    // If we're at root, return empty
    if (pathParts.length === 0) {
      return items;
    }

    // Add workspace name if we have workspace data (skip generic "Workspace")
    if (currentWorkspace) {
      const workspaceName = currentWorkspace.title || currentWorkspace.name || 'Workspace';
      items.push({
        label: truncateText(workspaceName),
        path: currentBase ? `/base/${currentBase.id}` : undefined,
        isClickable: !!currentBase
      });
    }

    // Add base name if we're in a base context
    if (pathParts[0] === 'base' && pathParts[1] && currentBase) {
      const baseName = currentBase.title || currentBase.name || 'Base';
      items.push({
        label: truncateText(baseName),
        path: `/base/${currentBase.id}`,
        isClickable: true
      });
    }

    // Add table name only if we're actually in a table context
    if (pathParts[0] === 'base' && pathParts[1] && pathParts[2] === 'table' && pathParts[3] && currentTable) {
      // Handle both direct table object and normalized table structure
      const tableData = currentTable.model || currentTable;
      const tableId = tableData.id || pathParts[3];
      const tableName = tableData.title || tableData.name || 'Table';
      
      if (tableId) {
        items.push({
          label: truncateText(tableName),
          path: `/base/${currentBase?.id}/table/${tableId}/grid`,
          isClickable: true
        });
      }
    }

    // Add view name only if we're actually in a view context
    if (pathParts[0] === 'base' && pathParts[1] && pathParts[2] === 'table' && pathParts[3] && pathParts[4] && currentView) {
      const viewName = currentView.title || currentView.name || 'View';
      items.push({
        label: truncateText(viewName),
        isClickable: false
      });
    }

    return items;
  };

  const breadcrumbItems = buildBreadcrumbItems();

  const handleBreadcrumbClick = async (item: BreadcrumbItem) => {
    if (!item.isClickable || !item.path || item.path === location.pathname) {
      return;
    }

    try {
      const targetPath = item.path;
      const navigationStore = useNavigationStore.getState();
      
      if (targetPath === '/workspace') {
        // Going to workspace - clear everything
        navigationStore.reset();
        navigate('/workspace');
      } else if (targetPath.startsWith('/base/')) {
        const pathParts = targetPath.split('/');
        const baseId = pathParts[2];
        const tableId = pathParts[4];
        const workspaceId = currentWorkspace?.id;
        
        if (!workspaceId || !baseId) {
          console.warn('Missing required IDs for navigation');
          return;
        }

        if (targetPath.includes('/table/') && tableId) {
          // Going to table level - clear view only
          await navigationStore.navigateToTable(workspaceId, baseId, tableId);
        } else {
          // Going to base level - clear table and view
          await navigationStore.navigateToBase(workspaceId, baseId);
        }
        
        // Navigate after state is updated
        navigate(targetPath);
      }
    } catch (error) {
      console.warn('Navigation failed:', error);
    }
  };

  // Don't render if no items
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm overflow-hidden p-3" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
          )}
          <div 
            className={`flex items-center space-x-1 min-w-0 max-w-xs ${
              item.isClickable 
                ? 'cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-gray-100' 
                : ''
            }`}
            onClick={() => handleBreadcrumbClick(item)}
          >
            <span className={`font-medium truncate ${
              index === breadcrumbItems.length - 1 
                ? 'text-[var(--color-text-primary)]' 
                : item.isClickable 
                  ? 'text-gray-700 hover:text-[var(--color-text-primary)]' 
                  : 'text-gray-500'
            }`} title={item.label.length > 20 ? item.label : undefined}>
              {item.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
