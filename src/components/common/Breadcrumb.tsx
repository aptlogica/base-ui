import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../stores/navigationStore';
import { useWorkspaceDataService } from '../../hooks/workspace/useWorkspaceDataService';
import { ChevronRight, ChevronDown, Database, Sheet, Plus } from 'lucide-react';
import { useWorkspaceBases, useBaseTables, useTableViews, useUpdateBase, useDeleteBase, useCreateBase } from '../../hooks/useApi';
import { getViewIconInfo } from '../../types/viewTypes';
import { useNavigateToBaseFirstView } from '../../hooks/useNavigateToBaseFirstView';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { BaseMenu } from './BaseMenu';
import { EditItemModal } from '../modals/EditItemModal';
import { AddBaseMembersModal } from '../modals/AddBaseMembersModal';
import { CreateBaseModal } from '../modals/CreateBaseModal';
import { DeleteBaseModal } from '../modals/DeleteBaseModal';
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useToast } from './Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';
import { getInitials } from '../../utils/helpers';
import type { Base, BasesResponse, BaseResponse, ViewsResponse, TablesResponse, TableResponse } from '../../types/api.types';

interface BreadcrumbItem {
  type: 'base' | 'table' | 'view';
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
}

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  base?: Base;
}

// Wrapper component to handle base menu permissions
const BaseMenuWrapper: React.FC<{
  base: Base;
  onEdit: (base: Base) => void;
  onAddMembers: (base: Base) => void;
  onDelete: (base: Base) => void;
}> = ({ base, onEdit, onAddMembers, onDelete }) => {
  const { canUpdateBase: canUpdateBaseFromWorkspace, canDeleteBase: canDeleteBaseFromWorkspace, canAssignUsers } = useWorkspaceAccess(base.workspace_id);
  const { canUpdateBase: canUpdateBaseFromBase, canDeleteBase: canDeleteBaseFromBase, canManageBaseMembers, baseAccess } = useBaseAccess(base.id);

  // Base-member can edit title/description, but not delete or manage members
  const canEdit = canUpdateBaseFromWorkspace() || canUpdateBaseFromBase() || baseAccess === 'base-member';
  const canDelete = canDeleteBaseFromWorkspace() || canDeleteBaseFromBase();
  const canAddMembers = canAssignUsers() || canManageBaseMembers();
  const hasAnyAction = canEdit || canDelete || canAddMembers;

  // Don't render menu if no actions are available
  if (!hasAnyAction) {
    return null;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        // Prevent closing the dropdown when clicking the menu trigger
      }}
      onMouseDown={(e) => {
        // Prevent the click-outside handler from closing the dropdown
        e.stopPropagation();
      }}
    >
      <BaseMenu
        base={base}
        onEdit={onEdit}
        onAddMembers={onAddMembers}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        canAddMembers={canAddMembers}
      />
    </div>
  );
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId } = useNavigationStore();
  const { navigateToFirstView } = useNavigateToBaseFirstView();
  const { canCreateBase, isBaseLevelAccess } = useWorkspaceAccess(selectedWorkspaceId || undefined);
  const updateBaseMutation = useUpdateBase();
  const deleteBaseMutation = useDeleteBase();
  const createBaseMutation = useCreateBase();
  const { handleBaseDeletion } = useNavigationActions();

  // State for base actions
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [deletingBase, setDeletingBase] = useState<Base | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [baseForMembers, setBaseForMembers] = useState<Base | null>(null);

  // State for create modals
  const [showCreateBase, setShowCreateBase] = useState(false);

  // Get data for breadcrumb items
  const { baseByIdQuery, tableByIdQuery, viewByIdQuery } = useWorkspaceDataService(
    selectedWorkspaceId || undefined,
    selectedBaseId || undefined,
    selectedTableId || undefined,
    selectedViewId || undefined
  );

  // Fetch alternatives for dropdowns
  const workspaceBasesQuery = useWorkspaceBases(selectedWorkspaceId || '');
  const baseTablesQuery = useBaseTables(selectedBaseId || '');
  const tableViewsQuery = useTableViews(selectedTableId || '');

  // Get base icon (matching homepage styling)
  const getBaseIcon = (base: Base, index: number) => {
    const title = base.title || base.name || '';
    const initials = getInitials(title, 'B');
    const firstLetter = initials.charAt(0);

    // Color mapping based on first letter or index - using lighter pastel colors
    const colorMap: Record<string, string> = {
      'G': 'bg-green-400', // Light pastel green for General
      'C': 'bg-blue-500',   // Blue for Computing
      'N': 'bg-purple-400', // Light purple for New
      'P': 'bg-orange-400', // Light orange for Practicals
    };

    const color = colorMap[firstLetter] || ['bg-green-400', 'bg-blue-500', 'bg-purple-400', 'bg-orange-400'][index % 4];

    return {
      letter: initials || 'B',
      color: color
    };
  };

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<'base' | 'table' | 'view' | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const baseDropdownRef = useRef<HTMLDivElement>(null);
  const tableDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const ignoreNextClickRef = useRef(false);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (!openDropdown) {
      setDropdownPosition(null);
      return;
    }

    const targetRef =
      openDropdown === 'base' ? baseDropdownRef :
        openDropdown === 'table' ? tableDropdownRef :
          viewDropdownRef;

    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  }, [openDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Ignore the click that opened the dropdown
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }

      const target = event.target as Node;
      const portal = document.querySelector('.breadcrumb-dropdown-portal');

      // Check if click is inside the portal (including buttons)
      const clickedInside =
        (baseDropdownRef.current && baseDropdownRef.current.contains(target)) ||
        (tableDropdownRef.current && tableDropdownRef.current.contains(target)) ||
        (viewDropdownRef.current && viewDropdownRef.current.contains(target)) ||
        (portal && portal.contains(target));

      if (!clickedInside) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    // Use a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.BREADCRUMB);

  if (!isRouteVisible) {
    return null;
  }

  const pathname = location.pathname;
  const currentBase = (baseByIdQuery.data as BaseResponse | undefined)?.data;
  const currentTable = (tableByIdQuery.data as TableResponse | undefined)?.data;
  const currentView = viewByIdQuery.data;

  // Build breadcrumb items (only Base > Table > View, no workspace)
  const buildBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const pathParts = pathname.split('/').filter(Boolean);

    // Check for new route format: /workspace/:workspaceId/base/:baseId/table/:tableId/:viewId
    // pathParts: ['workspace', workspaceId, 'base', baseId, 'table', tableId, viewId]
    const isNewFormat = pathParts[0] === 'workspace' && pathParts[2] === 'base';
    
    // Determine indices based on route format
    let baseIndex = -1;
    let tableIndex = -1;
    let viewIndex = -1;
    
    if (isNewFormat) {
      // New format: /workspace/:workspaceId/base/:baseId/table/:tableId/:viewId
      baseIndex = 3;
      tableIndex = 5;
      viewIndex = 6;
    } else if (pathParts[0] === 'base') {
      // Legacy format: /base/:baseId/table/:tableId/:viewId (kept for safety)
      baseIndex = 1;
      tableIndex = 3;
      viewIndex = pathParts[4] ? 4 : -1;
    }

    // Add base
    if (baseIndex > 0 && pathParts[baseIndex] && currentBase) {
      const baseName = currentBase.title || currentBase.name || 'Base';
      const baseImageRaw = currentBase.image || currentBase.logo || currentBase.meta?.image;
      const baseImage = typeof baseImageRaw === 'string' ? baseImageRaw : undefined;
      const baseIcon = getBaseIcon(currentBase, 0);

      // Use image if available, otherwise use initial with colored background
      const baseIconElement = baseImage ? (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={baseImage}
            alt={baseName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`w-8 h-8 ${baseIcon.color} rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
          {baseIcon.letter}
        </div>
      );

      const basePath = selectedWorkspaceId
        ? `/workspace/${selectedWorkspaceId}`
        : '/workspace';

      items.push({
        type: 'base',
        id: currentBase.id,
        label: baseName,
        icon: baseIconElement,
        path: basePath
      });
    }

    // Add table
    if (tableIndex > 0 && pathParts[tableIndex] && currentTable) {
      const tableData = currentTable.model || currentTable;
      const tableId = tableData.id || pathParts[tableIndex];
      const tableName = tableData.title || (tableData as any).name || 'Table';

      if (tableId && selectedWorkspaceId && currentBase) {
        items.push({
          type: 'table',
          id: tableId,
          label: tableName,
          icon: <Sheet size={14} className="text-blue-600" />,
          path: `/workspace/${selectedWorkspaceId}/base/${currentBase.id}/table/${tableId}/grid`
        });
      }
    }

    // Add view
    if (viewIndex > 0 && pathParts[viewIndex] && currentView) {
      const viewName = currentView.title || currentView.name || 'View';
      const viewType = currentView.type || 'grid';
      const viewIconInfo = getViewIconInfo(viewType);
      const ViewIcon = viewIconInfo.icon;

      if (selectedWorkspaceId && currentBase && selectedTableId) {
        items.push({
          type: 'view',
          id: currentView.id,
          label: viewName,
          icon: <ViewIcon size={14} className="text-purple-600" />,
          path: `/workspace/${selectedWorkspaceId}/base/${currentBase.id}/table/${selectedTableId}/${currentView.id}`
        });
      }
    }

    return items;
  };

  const breadcrumbItems = buildBreadcrumbItems();

  // Handlers for base actions
  const handleEditBase = (base: Base) => {
    setEditingBase(base);
    // Close the dropdown when opening edit modal
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const handleSaveBase = async ({ name, description }: { name: string; description: string }) => {
    if (!editingBase) return;

    try {
      const updates = {
        title: name,
        description: description || '',
      };

      await updateBaseMutation.mutateAsync({
        baseId: editingBase.id,
        updates,
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base updated successfully');
      setEditingBase(null);
    } catch (err: any) {
      console.error('Failed to update base:', err);
      toast.error(err?.message || 'Failed to update base. Please try again.');
    }
  };

  const handleDeleteBase = (base: Base) => {
    setDeletingBase(base);
    // Close the dropdown when opening delete modal
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const handleConfirmDelete = async (baseId: string) => {
    try {
      // Get current bases BEFORE deletion
      const basesResponse = workspaceBasesQuery.data as BasesResponse | undefined;
      const currentBases = basesResponse?.data || [];
      const remainingBases = currentBases.filter((base) => base.id !== baseId);

      await deleteBaseMutation.mutateAsync(baseId);

      // Handle navigation BEFORE calling handleBaseDeletion
      if (remainingBases.length > 0 && selectedWorkspaceId) {
        try {
          await navigateToFirstView(remainingBases[0].id);
        } catch (err) {
          navigate(`/workspace/${selectedWorkspaceId}`);
        }
      } else if (selectedWorkspaceId) {
        navigate(`/workspace/${selectedWorkspaceId}`);
      } else {
        navigate('/workspace');
      }

      // Now clean up navigation state
      handleBaseDeletion(baseId);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base deleted successfully');
      setOpenDropdown(null);
      setDropdownPosition(null);
    } catch (err: any) {
      console.error('Failed to delete base:', err);
      toast.error(err?.message || 'Failed to delete base. Please try again.');
      throw err; // Re-throw so modal can handle it
    }
  };

  const handleAddMembers = (base: Base) => {
    setBaseForMembers(base);
    setShowAddMembers(true);
    // Close the dropdown when opening add members modal
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const handleCreateBase = async ({ name, description, image }: { name: string; description: string; image?: File | null }) => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace first');
      return;
    }

    try {
      const newBase = await createBaseMutation.mutateAsync({
        title: name,
        description: description || '',
        workspace_id: selectedWorkspaceId,
        image: image || undefined,
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base created successfully');
      setShowCreateBase(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create base. Please try again.');
    }
  };

  // Get dropdown items for each level
  const getBaseDropdownItems = (): DropdownItem[] => {
    const basesResponse = workspaceBasesQuery.data as BasesResponse | undefined;
    let bases = basesResponse?.data || [];

    // If workspace access is "base", filter to only show bases user has access to
    if (isBaseLevelAccess()) {
      bases = bases.filter((base) => {
        const baseAccess = base?.access_level?.toLowerCase();
        // Show bases where user has any valid access level
        return baseAccess === 'owner' ||
          baseAccess === 'maintainer' ||
          baseAccess === 'base-member' ||
          baseAccess === 'base-read' ||
          baseAccess === 'workspace-read';
      });
    }

    return bases.map((base, index: number) => {
      const icon = getBaseIcon(base, index);
      const baseName = base.title || base.name || 'Base';
      const baseImageRaw = base.image || base.logo || base.meta?.image;
      const baseImage = typeof baseImageRaw === 'string' ? baseImageRaw : undefined;

      // Use image if available, otherwise use initial with colored background
      const baseIconElement = baseImage ? (
        <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border">
          <img
            src={baseImage}
            alt={baseName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`w-8 h-8 ${icon.color} rounded-md flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
          {icon.letter}
        </div>
      );

      return {
        id: base.id,
        label: baseName,
        icon: baseIconElement,
        onClick: async () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          try {
            await navigateToFirstView(base.id);
          } catch (err) {
            if (selectedWorkspaceId) {
              navigate(`/workspace/${selectedWorkspaceId}`);
            } else {
              navigate('/workspace');
            }
          }
        },
        isActive: base.id === selectedBaseId,
        base: base // Include full base object for menu
      };
    });
  };

  const getTableDropdownItems = (): DropdownItem[] => {
    const tablesResponse = baseTablesQuery.data as TablesResponse | undefined;
    const tables = tablesResponse?.data || [];
    return tables.map((item) => {
      const table = item.model || item;
      const tableId = table.id;
      return {
        id: tableId,
        label: table.title || 'Table',
        icon: (
          <Sheet size={16} color="#2563eb" />
        ),
        onClick: () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          const { navigateToTable } = useNavigationStore.getState();
          if (selectedWorkspaceId && selectedBaseId) {
            navigateToTable(selectedWorkspaceId, selectedBaseId, tableId);
            navigate(`/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${tableId}/grid`);
          }
        },
        isActive: tableId === selectedTableId
      };
    });
  };

  const getViewDropdownItems = (): DropdownItem[] => {
    const viewsResponse = tableViewsQuery.data as ViewsResponse | undefined;
    const views = viewsResponse?.data || [];
    return views.map((view) => {
      const viewType = view.type || 'grid';
      const viewIconInfo = getViewIconInfo(viewType);
      const ViewIcon = viewIconInfo.icon;
      return {
        id: view.id,
        label: view.title || 'View',
        icon: (
          <ViewIcon size={16} style={{ color: viewIconInfo.color }} />
        ),
        onClick: () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          const { navigateToView } = useNavigationStore.getState();
          if (selectedWorkspaceId && selectedBaseId && selectedTableId) {
            navigateToView(selectedWorkspaceId, selectedBaseId, selectedTableId, view.id);
            navigate(`/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${view.id}`);
          }
        },
        isActive: view.id === selectedViewId
      };
    });
  };

  const handleSegmentClick = (e: React.MouseEvent, type: 'base' | 'table' | 'view') => {
    e.stopPropagation();
    if (openDropdown === type) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      ignoreNextClickRef.current = true;
      setOpenDropdown(type);
    }
  };

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm overflow-hidden" aria-label="Breadcrumb">
      <div className="py-2">
        <ChevronRight className="w-fit h-6 text-gray-300" />
      </div>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isDropdownOpen = openDropdown === item.type;
        const dropdownItems =
          item.type === 'base' ? getBaseDropdownItems() :
            item.type === 'table' ? getTableDropdownItems() :
              getViewDropdownItems();

        return (
          <React.Fragment key={`${item.type}-${item.id}`}>
            {index > 0 && (
              <ChevronRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
            )}
            <div className="relative" ref={
              item.type === 'base' ? baseDropdownRef :
                item.type === 'table' ? tableDropdownRef :
                  viewDropdownRef
            }>
              <div
                className="flex items-center gap-1.5 cursor-pointer rounded px-2 py-1 transition-colors hover:bg-gray-100 group"
                onClick={(e) => handleSegmentClick(e, item.type)}
              >
                {item.icon}
                <span className={`font-medium truncate max-w-[150px] ${isLast
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-gray-700 group-hover:text-[var(--color-text-primary)]'
                  }`} title={item.label}>
                  {item.label}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </div>

              {/* Dropdown Menu - Portal to body to avoid overflow clipping */}
              {isDropdownOpen && dropdownPosition && ReactDOM.createPortal(
                <div
                  className="breadcrumb-dropdown-portal fixed bg-card border rounded-xl shadow-lg z-[9999] w-80 flex flex-col overflow-hidden"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-4 py-2 flex-shrink-0">
                      <div className="text-xs font-semibold text-primary tracking-wide">
                        {item.type === 'base' ? 'Bases' : item.type === 'table' ? 'Tables' : 'Views'}
                      </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto flex-1 max-h-48 p-2">
                      {dropdownItems.length > 0 ? (
                        dropdownItems.map((dropdownItem) => (
                          <div
                            key={dropdownItem.id}
                            className="w-full rounded-lg text-left p-2 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              dropdownItem.onClick();
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              {dropdownItem.icon}

                              {/* Label */}
                              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                <span className="font-semibold text-primary truncate">
                                  {dropdownItem.label}
                                </span>

                                {/* Right side: Status dot + Menu (for bases only) */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Status Indicator - only for selected */}
                                  {dropdownItem.isActive && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}

                                  {/* Base Menu - only for base items */}
                                  {item.type === 'base' && dropdownItem.base && (
                                    <BaseMenuWrapper
                                      base={dropdownItem.base}
                                      onEdit={handleEditBase}
                                      onAddMembers={handleAddMembers}
                                      onDelete={handleDeleteBase}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No items found.
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    {dropdownItems.length > 0 && (
                      <div className="border-t flex-shrink-0"></div>
                    )}

                    {/* Only show Create Base button */}
                    {item.type === 'base' && canCreateBase() && (
                      <div className="p-2 flex-shrink-0">
                        <button
                          className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-gray-100 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => {
                            e.stopPropagation();

                            // Close dropdown first
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                            ignoreNextClickRef.current = true;

                            // Open create base modal
                            setShowCreateBase(true);
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                          <span>Create New Base</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>
          </React.Fragment>
        );
      })}

      {/* Modals for base actions */}
      {editingBase && (
        <EditItemModal
          isOpen={!!editingBase}
          onClose={() => setEditingBase(null)}
          onSave={handleSaveBase}
          title="Edit Base"
          subtitle="Update base name and description"
          icon={<Database size={20} className="icon-primary" />}
          initialName={editingBase.title || editingBase.name || ''}
          initialDescription={editingBase.description || ''}
          itemType="base"
          existingItems={((workspaceBasesQuery.data as BasesResponse | undefined)?.data || []).map((b) => ({
            id: b.id,
            name: b.title || b.name || '',
          }))}
          currentItemId={editingBase.id}
          initialImage={editingBase.image || editingBase.logo || (typeof editingBase.meta === 'object' && editingBase.meta !== null && 'image' in editingBase.meta ? String(editingBase.meta.image) : null) || null}
        />
      )}

      {/* Delete Base Confirmation Modal */}
      <DeleteBaseModal
        isOpen={!!deletingBase}
        base={deletingBase}
        onClose={() => {
          setDeletingBase(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {showAddMembers && baseForMembers && (
        <AddBaseMembersModal
          isOpen={showAddMembers}
          onClose={() => {
            setShowAddMembers(false);
            setBaseForMembers(null);
          }}
          onSuccess={() => {
            setShowAddMembers(false);
            setBaseForMembers(null);
          }}
          workspaceId={selectedWorkspaceId || baseForMembers.workspace_id || ''}
          baseId={baseForMembers.id}
        />
      )}

      {/* Create Base Modal */}
      {showCreateBase && selectedWorkspaceId && (
        <CreateBaseModal
          isOpen={showCreateBase}
          onClose={() => setShowCreateBase(false)}
          onCreate={handleCreateBase}
          workspaceId={selectedWorkspaceId}
          existingBases={(workspaceBasesQuery.data as BasesResponse | undefined)?.data || []}
        />
      )}
    </nav>
  );
};

export default Breadcrumb;
