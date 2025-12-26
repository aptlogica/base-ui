import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../stores/navigationStore';
import { useWorkspaceDataService } from '../../hooks/workspace/useWorkspaceDataService';
import { ChevronRight, ChevronDown, Database, Sheet, Plus } from 'lucide-react';
import { useWorkspaceBases, useBaseTables, useTableViews, useUpdateBase, useDeleteBase, useCreateBase /*, useCreateTable */ } from '../../hooks/useApi';
import { getViewIconInfo } from '../../types/viewTypes';
import { useNavigateToBaseFirstView } from '../../hooks/useNavigateToBaseFirstView';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { BaseMenu } from './BaseMenu';
import { EditItemModal } from '../modals/EditItemModal';
import { AssignUserToWorkspaceModal } from '../modals/AssignUserToWorkspaceModal';
import { CreateBaseModal } from '../modals/CreateBaseModal';
// import { CreateTableModal } from '../modals/CreateTableModal'; // COMMENTED OUT: Create table functionality
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useToast } from './Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';

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
  base?: any; // For base items, include the full base object
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId } = useNavigationStore();
  const { navigateToFirstView } = useNavigateToBaseFirstView();
  const { canCreateBase, /* canCreateTable, canCreateView, */ canUpdateBase, canDeleteBase, canAssignUsers } = useWorkspaceAccess(selectedWorkspaceId || undefined);
  const updateBaseMutation = useUpdateBase();
  const deleteBaseMutation = useDeleteBase();
  const createBaseMutation = useCreateBase();
  // const createTableMutation = useCreateTable(); // COMMENTED OUT: Create table functionality
  const { handleBaseDeletion } = useNavigationActions();

  // State for base actions
  const [editingBase, setEditingBase] = useState<any | null>(null);
  const [deletingBase, setDeletingBase] = useState<any | null>(null);
  const [baseNameToDelete, setBaseNameToDelete] = useState('');
  const [isDeletingBase, setIsDeletingBase] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [baseForMembers, setBaseForMembers] = useState<any | null>(null);

  // State for create modals
  const [showCreateBase, setShowCreateBase] = useState(false);
  // const [showCreateTable, setShowCreateTable] = useState(false); // COMMENTED OUT: Create table functionality

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
  const getBaseIcon = (base: any, index: number) => {
    const title = base.title || base.name || '';
    const firstLetter = title.charAt(0).toUpperCase();

    // Color mapping based on first letter or index - using lighter pastel colors
    const colorMap: Record<string, string> = {
      'G': 'bg-green-400', // Light pastel green for General
      'C': 'bg-blue-500',   // Blue for Computing
      'N': 'bg-purple-400', // Light purple for New
      'P': 'bg-orange-400', // Light orange for Practicals
    };

    const color = colorMap[firstLetter] || ['bg-green-400', 'bg-blue-500', 'bg-purple-400', 'bg-orange-400'][index % 4];

    return {
      letter: firstLetter || 'B',
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
  const currentBase = baseByIdQuery.data?.data;
  const currentTable = tableByIdQuery.data?.data;
  const currentView = viewByIdQuery.data;

  // Build breadcrumb items (only Base > Table > View, no workspace)
  const buildBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const pathParts = pathname.split('/').filter(Boolean);

    // Add base
    if (pathParts[0] === 'base' && pathParts[1] && currentBase) {
      const baseName = currentBase.title || currentBase.name || 'Base';
      const baseImage = currentBase.image || currentBase.logo || currentBase.meta?.image;
      const baseIcon = getBaseIcon(currentBase, 0);

      // Use image if available, otherwise use initial with colored background
      const baseIconElement = baseImage ? (
        <div className="w-5 h-5 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={baseImage}
            alt={baseName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`w-6 h-6 ${baseIcon.color} rounded-lg flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0`}>
          {baseIcon.letter}
        </div>
      );

      items.push({
        type: 'base',
        id: currentBase.id,
        label: baseName,
        icon: baseIconElement,
        path: `/base/${currentBase.id}`
      });
    }

    // Add table
    if (pathParts[0] === 'base' && pathParts[1] && pathParts[2] === 'table' && pathParts[3] && currentTable) {
      const tableData = currentTable.model || currentTable;
      const tableId = tableData.id || pathParts[3];
      const tableName = tableData.title || tableData.name || 'Table';

      if (tableId) {
        items.push({
          type: 'table',
          id: tableId,
          label: tableName,
          icon: <Sheet size={14} className="text-blue-600" />,
          path: `/base/${currentBase?.id}/table/${tableId}/grid`
        });
      }
    }

    // Add view
    if (pathParts[0] === 'base' && pathParts[1] && pathParts[2] === 'table' && pathParts[3] && pathParts[4] && currentView) {
      const viewName = currentView.title || currentView.name || 'View';
      const viewType = currentView.type || 'grid';
      const viewIconInfo = getViewIconInfo(viewType);
      const ViewIcon = viewIconInfo.icon;

      items.push({
        type: 'view',
        id: currentView.id,
        label: viewName,
        icon: <ViewIcon size={14} className="text-purple-600" />,
        path: `/base/${currentBase?.id}/table/${selectedTableId}/${currentView.id}`
      });
    }

    return items;
  };

  const breadcrumbItems = buildBreadcrumbItems();

  // Handlers for base actions
  const handleEditBase = (base: any) => {
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

  const handleDeleteBase = (base: any) => {
    setDeletingBase(base);
    setBaseNameToDelete('');
    setIsDeletingBase(false);
    // Close the dropdown when opening delete modal
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBase) return;

    const baseTitle = deletingBase.title || deletingBase.name || '';
    if (baseNameToDelete !== baseTitle) {
      toast.error('Base name does not match');
      return;
    }

    try {
      await deleteBaseMutation.mutateAsync(deletingBase.id);

      // Use the navigation handler to properly clean up localStorage
      handleBaseDeletion(deletingBase.id);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base deleted successfully');
      setDeletingBase(null);
      setBaseNameToDelete('');
      setIsDeletingBase(false);
      setOpenDropdown(null);
      setDropdownPosition(null);
    } catch (err: any) {
      console.error('Failed to delete base:', err);
      toast.error(err?.message || 'Failed to delete base. Please try again.');
    }
  };

  const handleAddMembers = (base: any) => {
    setBaseForMembers(base);
    setShowAddMembers(true);
    // Close the dropdown when opening add members modal
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const handleCreateBase = async ({ name, description }: { name: string; description: string }) => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace first');
      return;
    }

    try {
      const newBase = await createBaseMutation.mutateAsync({
        title: name,
        description: description || '',
        workspace_id: selectedWorkspaceId,
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base created successfully');
      setShowCreateBase(false);

      // Navigate to the new base's first view
      if (newBase?.data?.id) {
        try {
          await navigateToFirstView(newBase.data.id);
        } catch (err) {
          navigate('/homepage');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create base. Please try again.');
    }
  };

  // COMMENTED OUT: Create Table functionality
  // const handleCreateTable = async ({ name, description }: { name: string; description: string }) => {
  //   if (!selectedWorkspaceId || !selectedBaseId) {
  //     toast.error('Please select a workspace and base first');
  //     return;
  //   }

  //   try {
  //     // Get the count of existing tables to set order_index
  //     const existingTables = baseTablesQuery.data?.data || [];
  //     const order_index = existingTables.length;

  //     const newTable = await createTableMutation.mutateAsync({
  //       base_id: selectedBaseId,
  //       workspace_id: selectedWorkspaceId,
  //       title: name,
  //       description: description || '',
  //       order_index
  //     });

  //     // Invalidate queries to refresh the tables list
  //     queryClient.invalidateQueries({ queryKey: ['bases', selectedBaseId, 'tables'] });
  //     queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });

  //     toast.success('Table created successfully');
  //     setShowCreateTable(false);

  //     // Navigate to the newly created table
  //     if (newTable?.data?.id) {
  //       const { navigateToTable } = useNavigationStore.getState();
  //       navigateToTable(selectedWorkspaceId, selectedBaseId, newTable.data.id);
  //       navigate(`/base/${selectedBaseId}/table/${newTable.data.id}/grid`);
  //     }
  //   } catch (err: any) {
  //     toast.error(err?.message || 'Failed to create table. Please try again.');
  //   }
  // };

  // Get dropdown items for each level
  const getBaseDropdownItems = (): DropdownItem[] => {
    const bases = workspaceBasesQuery.data?.data || [];
    return bases.map((base: any, index: number) => {
      const icon = getBaseIcon(base, index);
      return {
        id: base.id,
        label: base.title || base.name || 'Base',
        icon: (
          <div className={`w-6 h-6 ${icon.color} rounded-md flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0`}>
            {icon.letter}
          </div>
        ),
        onClick: async () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          try {
            await navigateToFirstView(base.id);
          } catch (err) {
            navigate('/homepage');
          }
        },
        isActive: base.id === selectedBaseId,
        base: base // Include full base object for menu
      };
    });
  };

  const getTableDropdownItems = (): DropdownItem[] => {
    const tables = baseTablesQuery.data?.data || [];
    return tables.map((item: any) => {
      const table = item.model || item;
      const tableId = table.id;
      return {
        id: tableId,
        label: table.title || table.name || 'Table',
        icon: (
          <Sheet size={16} color="#2563eb" />
        ),
        onClick: () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          const { navigateToTable } = useNavigationStore.getState();
          if (selectedWorkspaceId && selectedBaseId) {
            navigateToTable(selectedWorkspaceId, selectedBaseId, tableId);
            navigate(`/base/${selectedBaseId}/table/${tableId}/grid`);
          }
        },
        isActive: tableId === selectedTableId
      };
    });
  };

  const getViewDropdownItems = (): DropdownItem[] => {
    const views = tableViewsQuery.data?.data || [];
    return views.map((view: any) => {
      const viewType = view.type || 'grid';
      const viewIconInfo = getViewIconInfo(viewType);
      const ViewIcon = viewIconInfo.icon;
      return {
        id: view.id,
        label: view.title || view.name || 'View',
        icon: (
          <ViewIcon size={16} style={{ color: viewIconInfo.color }} />
        ),
        onClick: () => {
          setOpenDropdown(null);
          setDropdownPosition(null);
          const { navigateToView } = useNavigationStore.getState();
          if (selectedWorkspaceId && selectedBaseId && selectedTableId) {
            navigateToView(selectedWorkspaceId, selectedBaseId, selectedTableId, view.id);
            navigate(`/base/${selectedBaseId}/table/${selectedTableId}/${view.id}`);
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
                                        base={dropdownItem.base}
                                        onEdit={handleEditBase}
                                        onAddMembers={handleAddMembers}
                                        onDelete={handleDeleteBase}
                                        canEdit={canUpdateBase()}
                                        canDelete={canDeleteBase()}
                                        canAddMembers={canAssignUsers()}
                                      />
                                    </div>
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

                    {/* Create Button - always visible at bottom if user has permission */}
                    {/* COMMENTED OUT: Create Table and Create View functionality */}
                    {/* {((item.type === 'base' && canCreateBase()) ||
                      (item.type === 'table' && canCreateTable()) ||
                      (item.type === 'view' && canCreateView())) && (
                        <div className="p-2 flex-shrink-0">
                          <button
                            className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-muted/30 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();

                              // Close dropdown first
                              setOpenDropdown(null);
                              setDropdownPosition(null);
                              ignoreNextClickRef.current = true;

                              // Open appropriate modal
                              if (item.type === 'base') {
                                setShowCreateBase(true);
                              } else if (item.type === 'table') {
                                setShowCreateTable(true);
                              }
                              // TODO: Add view creation modal
                            }}
                          >
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                            <span>
                              {item.type === 'base' ? 'Create New Base' :
                                item.type === 'table' ? 'Create New Table' :
                                  'Create New View'}
                            </span>
                          </button>
                        </div>
                      )} */}
                    {/* Only show Create Base button */}
                    {item.type === 'base' && canCreateBase() && (
                      <div className="p-2 flex-shrink-0">
                        <button
                          className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-muted/30 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
          existingItems={(workspaceBasesQuery.data?.data || []).map((b: any) => ({
            id: b.id,
            name: b.title || b.name || '',
          }))}
          currentItemId={editingBase.id}
          initialImage={editingBase.image || editingBase.logo || editingBase.meta?.image || null}
        />
      )}

      {/* Delete Base Confirmation Modal */}
      {deletingBase && (
        <div className="bg-modal-backdrop">
          <div className="bg-modal !h-[50vh] !max-w-2xl flex flex-col">
            <h3 className="text-[1.25rem] text-gray-900 mb-4 pb-3 border-b border-primary">Delete Base</h3>
            <div className="flex-grow">
              <div className="bg-[var(--color-error-50)] border border-red-200 rounded-md p-2 mb-4">
                <p className="text-red-800 mb-2">
                  <strong>Warning:</strong> All associated tables, records, and data will be permanently deleted.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-primary">
                  <strong>Are you sure you want to proceed? This deletion cannot be reversed.</strong>
                  Confirming this action will permanently delete this base and all of its related contents.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-700">Please type <strong>{deletingBase.title || deletingBase.name}</strong> to confirm.</p>
              </div>
              <input
                type="text"
                value={baseNameToDelete}
                onChange={(e) => {
                  const value = e.target.value;
                  setBaseNameToDelete(value);
                  const baseTitle = deletingBase.title || deletingBase.name || '';
                  setIsDeletingBase(value === baseTitle);
                }}
                onPaste={(e) => e.preventDefault()}
                placeholder="Enter base name"
                className="field-component field-component-border field-component-focus mb-4"
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeletingBase(null);
                  setBaseNameToDelete('');
                  setIsDeletingBase(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!isDeletingBase}
                className="px-4 py-2 bg-red-600 text-primary rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Base
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMembers && baseForMembers && (
        <AssignUserToWorkspaceModal
          isOpen={showAddMembers}
          onClose={() => {
            setShowAddMembers(false);
            setBaseForMembers(null);
          }}
          workspaceId={selectedWorkspaceId || ''}
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
          existingBases={(workspaceBasesQuery.data?.data || [])}
        />
      )}

      {/* COMMENTED OUT: Create Table Modal */}
      {/* {showCreateTable && selectedBaseId && (
        <CreateTableModal
          isOpen={showCreateTable}
          onClose={() => setShowCreateTable(false)}
          onCreate={handleCreateTable}
          baseId={selectedBaseId}
          existingTables={(baseTablesQuery.data?.data || [])}
        />
      )} */}
    </nav>
  );
};

export default Breadcrumb;
