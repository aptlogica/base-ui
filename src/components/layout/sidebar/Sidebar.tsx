import React, { useRef, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Sheet, Plus, Download } from 'lucide-react';
import { Pin } from 'lucide-react';
import { useToast } from '../../common/Toast';

const CreateTableModal = lazy(() =>
  import('../../modals/CreateTableModal').then(m => ({ default: m.CreateTableModal }))
);
const ImportModal = lazy(() =>
  import('../../modals/ImportModal').then(m => ({ default: m.ImportModal }))
);
import { CreateBaseModal } from '../../modals/CreateBaseModal';
import TableOptionsMenu from '../../tables/TableOptionsMenu';

import { SidebarProps } from './types';
import { TableViewsWithData } from './components/TableViewsWithData';
import { CreateViewModalWrapper } from './components/CreateViewModalWrapper';
import { useWorkspaceBusinessLogic } from '../../../hooks/workspace/useWorkspaceBusinessLogic';
import { Loader } from '../../ui/Loader';
import { SidebarSkeleton } from '../../common/Skeleton/SidebarSkeleton';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
import { useUpdateBase } from '../../../hooks/useApi';

interface PinnedTables {
  [tableId: string]: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  sidebarPosition = 'left',
  sidebarWidth = 56,
  selectedWorkspace: propSelectedWorkspace, // Renamed to avoid conflict
  onWorkspaceUpdate: _onWorkspaceUpdate // Prefixed with _ to indicate intentionally unused
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const {
    // Data
    currentWorkspace,
    selectedBase,
    baseTables,
    // Loading & Error
    loading,
    error,
    // State & Actions
    selectedWorkspaceId,
    selectedBaseId,
    expandedTables,
    showCreateBaseWorkspaceId, setShowCreateBaseWorkspaceId,
    showCreateTableBaseId, setShowCreateTableBaseId,
    showCreateViewModal, setShowCreateViewModal,
    popoverRef, setPopoverRef,
    // Actions
    toggleTableExpansion,
    navigateToTable,
    navigateToView,
    handleCreateBaseForWorkspace,
    handleEditTable,
    handleDeleteTable,
    handleDeleteView,
    isTableActive,
    isViewActive,
    setViewsRefetchTrigger,
    createTableMutation,
    createViewMutation,
    // Plugin store state
    flyoutMode, flyoutOpen, isTransitioning,
  } = useWorkspaceBusinessLogic();

  // Use propSelectedWorkspace if available, otherwise fall back to currentWorkspace from business logic
  const effectiveSelectedWorkspace = propSelectedWorkspace || currentWorkspace;
  const { canCreateTable } = useBaseAccess(selectedBase?.id);
  const updateBaseMutation = useUpdateBase();
  
  // Import table modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<'csv' | 'excel' | 'sql' | 'json' | 'airtable' | 'nocodb' | null>(null);

  // Pinned tables state - stored in base.meta.pinnedTables
  const [pinnedTables, setPinnedTables] = useState<PinnedTables>(() => {
    return selectedBase?.meta?.pinnedTables || {};
  });

  // Use ref to track the latest pinnedTables without triggering effect
  const pinnedTablesRef = useRef(pinnedTables);
  useEffect(() => {
    pinnedTablesRef.current = pinnedTables;
  }, [pinnedTables]);

  // Sync pinnedTables when selectedBase changes
  useEffect(() => {
    if (selectedBase?.meta?.pinnedTables) {
      setPinnedTables(selectedBase.meta.pinnedTables);
    } else {
      setPinnedTables({});
    }
  }, [selectedBase?.id, selectedBase?.meta?.pinnedTables]);

  // Clean up orphaned pinned table IDs when tables change
  useEffect(() => {
    if (!selectedBase || !baseTables || typeof baseTables !== 'object' || !('data' in baseTables) || !Array.isArray((baseTables as any).data)) return;

    const tableIds = new Set((baseTables as any).data.map((item: any) => item.model.id));
    const currentPinnedIds = Object.keys(pinnedTablesRef.current);

    // Only proceed if there are pinned tables to check
    if (currentPinnedIds.length === 0) return;

    const orphanedIds = currentPinnedIds.filter(tableId => !tableIds.has(tableId));

    // Only update if there are orphaned IDs
    if (orphanedIds.length > 0) {
      const cleanedPinnedTables = currentPinnedIds.reduce((acc, tableId) => {
        if (tableIds.has(tableId)) {
          acc[tableId] = pinnedTablesRef.current[tableId];
        }
        return acc;
      }, {} as PinnedTables);

      setPinnedTables(cleanedPinnedTables);

      // Persist cleanup to base meta
      updateBaseMutation.mutate({
        baseId: selectedBase.id,
        updates: {
          meta: {
            ...selectedBase.meta,
            pinnedTables: cleanedPinnedTables,
          },
        },
      });
    }
  }, [baseTables, selectedBase?.id, selectedBase?.meta, updateBaseMutation]);

  // Handle pin toggle
  const handlePinToggle = async (tableId: string, newStatus: boolean) => {
    if (!selectedBase) return;

    const newPinnedTables = { ...pinnedTables, [tableId]: newStatus };
    setPinnedTables(newPinnedTables);

    try {
      await updateBaseMutation.mutateAsync({
        baseId: selectedBase.id,
        updates: {
          meta: {
            ...selectedBase.meta,
            pinnedTables: newPinnedTables,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update pinned status:', error);
      // Revert on error
      setPinnedTables((prev) => ({
        ...prev,
        [tableId]: !newStatus,
      }));
    }
  };

  // Sort tables to show pinned first - memoized for performance
  const sortedTables = useMemo(() => {
    if (!baseTables || typeof baseTables !== 'object' || !('data' in baseTables) || !Array.isArray((baseTables as any).data)) return [];

    return [...(baseTables as any).data].sort((a: any, b: any) => {
      const aPinned = pinnedTables[a.model.id] || false;
      const bPinned = pinnedTables[b.model.id] || false;

      if (aPinned && !bPinned) return -1; // a comes first
      if (!aPinned && bPinned) return 1;  // b comes first
      return 0; // Keep original order if both pinned or both unpinned
    });
  }, [baseTables, pinnedTables]);

  // Check if we're in layout mode (no onClose function means layout mode)
  const isLayoutMode = !onClose;

  // Click outside handler for flyout in floating mode
  useEffect(() => {
    if (!isLayoutMode) {
      const handleClick = (e: MouseEvent) => {
        // Only close if click is outside both sidebar and popover
        if (
          ref.current &&
          !ref.current.contains(e.target as Node) &&
          (!popoverRef || !popoverRef.contains(e.target as Node))
        ) {
          onClose?.();
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [onClose, popoverRef, isLayoutMode]);

  // Flyout style based on mode and position
  const flyoutStyle: React.CSSProperties = isLayoutMode
    ? { height: '100vh', display: 'flex', flexDirection: 'column' }
    : sidebarPosition === 'left'
      ? { minHeight: '100vh', left: sidebarWidth, right: 'auto', display: 'flex', flexDirection: 'column' }
      : { minHeight: '100vh', right: sidebarWidth, left: 'auto', display: 'flex', flexDirection: 'column' };

  // Loading and error states
  if (loading) return (
    <div className='p-4 h-full overflow-auto'>
      <SidebarSkeleton itemCount={5} />
    </div>
  );
  if (error) return <div className="p-8 text-red-600 flyout-error">{error}</div>;

  const renderFlyoutContent = () => (
    <>
      {/* Scrollable Content */}
      <div className="flyout-content sb-flyout-inner p-3 flex-1 overflow-y-auto min-h-0">
        {/* Tables Section */}
        {(() => {
          // Check if we have a current workspace
          if (!currentWorkspace) {
            return (
              <div className="text-gray-500 text-sm px-4 py-2 text-center">
                Please select a workspace
              </div>
            );
          }

          // Check if we have a selected base
          if (!selectedBase) {
            return (
              <div className="text-gray-500 text-sm px-4 py-2 text-center">
                Please select a base to view tables
              </div>
            );
          }

          if (loading) { // Use global loading from business logic
            return (
              <Loader
                text="Loading tables..."
                textPosition="bottom"
              />
            );
          }
          if (sortedTables.length === 0) {
            return (
              <div className="var(--color-text-primary) text-sm px-4 py-2 text-center">
                No tables in this base. Create your first table to get started.
              </div>
            );
          }
          return (sortedTables as any[]).map((item: any, index: number) => {
            const table = item.model;
            return (
              <div key={table.id}>
                <div
                  className={`flex items-center gap-3 py-1.5 px-3 mb-1 hover:bg-[var(--color-gray-100)] rounded-xl ${isTableActive(table.base_id, table.id) ? 'bg-background' : ''
                    } relative hover:shadow-xs transition-all ease-in duration-200`}
                >
                  {/* Expand/collapse chevron */}
                  <span
                    className="cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      toggleTableExpansion(table.id);
                    }}
                  >
                    <ChevronDown
                      size={12}
                      className={`text-[var(--color-gray-500)] ${expandedTables.includes(table.id) ? '' : 'rotate-[-90deg]'}`}
                    />
                  </span>
                  {/* Table icon */}
                  <span
                    className="cursor-pointer h-5 w-5"
                    onClick={e => {
                      e.stopPropagation();
                      toggleTableExpansion(table.id);
                    }}
                  >
                    <Sheet size={15} color="#2563eb" />
                  </span>

                  {/* Table name - navigate only */}
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      // Navigate to the table's default view (grid) and close the floating flyout if open
                      try {
                        navigateToTable(table.workspace_id, table.base_id, table.id);
                      } catch (err) {
                        console.warn('Navigation to table failed', err);
                      }
                      if (!isLayoutMode) {
                        onClose?.();
                      }
                    }}
                  >
                    <span
                      title={table.title}
                      className="font-medium text-[var(--color-text-tertiary)] truncate"
                      style={{ maxWidth: '200px' }}
                    >
                      {table.title}
                    </span>
                    {/* Pin indicator - always visible when pinned, tilted */}
                    {pinnedTables[table.id] && (
                      <Pin className="w-3 h-3 text-primary-brand fill-current rotate-45" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <TableOptionsMenu
                      table={table}
                      baseId={selectedBase?.id}
                      isPinned={pinnedTables[table.id] || false}
                      onPinToggle={handlePinToggle}
                      onRename={async (newName) => {
                        await handleEditTable(table.id, { title: newName });
                      }}
                      onEditDescription={async (description) => {
                        await handleEditTable(table.id, { description });
                      }}
                      onDelete={async () => {
                        try {
                          await handleDeleteTable(table);
                        } catch (err) {
                          console.error('Failed to delete table:', err);
                        }
                      }}
                      onEditingChange={(_isEditing) => {
                        // Editing state is handled internally by TableOptionsMenu
                      }}
                      portaled={true}
                    />
                  </div>
                </div>

                {/* Table views - fetched on-demand when table is expanded */}
                {expandedTables.includes(table.id) && (
                  <TableViewsWithData
                    table={table}
                    navigateToView={navigateToView}
                    isViewActive={isViewActive}
                    handleViewDeletion={handleDeleteView}
                    setShowCreateViewModal={setShowCreateViewModal}
                    setEditingViewId={() => {}}
                    setPopoverRef={setPopoverRef}
                    setViewsRefetchTrigger={setViewsRefetchTrigger}
                  />
                )}

                {/* Separator between tables */}
                {index < sortedTables.length - 1 && (
                  <div className="mx-2 my-2 border-t" />
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Fixed Footer - Non-scrollable */}
      <div className="sidebar-flyout-footer flex flex-col items-start gap-2 p-2 bg-card">
        {canCreateTable() && (
          <>
            <button
              className="w-full flex items-center justify-center gap-2 btn-secondary p-2 rounded transition"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedBase?.id && effectiveSelectedWorkspace?.id) {
                  setSelectedImportType('csv');
                  setShowImportModal(true);
                } else {
                  console.warn('No base or workspace selected. Cannot open Import Table modal.');
                }
              }}
              title={selectedBase && effectiveSelectedWorkspace ? "Import Table" : "Select a base to import a table"}
              disabled={!selectedBase || !effectiveSelectedWorkspace}
            >
              <Download size={16} /> Import Table
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 btn-primary p-2 rounded transition"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedBase?.id) {
                  setShowCreateTableBaseId(selectedBase.id);
                } else {
                  console.warn('No base selected. Cannot open Create Table modal.');
                }
              }}
              title={selectedBase ? "Create Table" : "Select a base to create a table"}
              disabled={!selectedBase}
            >
              <Plus size={16} /> Create Table
            </button>
          </>
        )}
      </div>
    </>
  );

  // Minimal CSS for slide animation (right -> left)
  const slideStyles = `
    /* Container animation: slight slide from right and fade */
    .sb-flyout-open { transform: translateX(0%); opacity: 1; transition: transform 280ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease-in; }
    .sb-flyout-close { transform: translateX(10%); opacity: 0; transition: transform 200ms cubic-bezier(.2,.9,.2,1), opacity 150ms ease-out; }
    /* Inner content stagger: slide a bit and fade in for children */
    .sb-flyout-inner { transform: translateX(6%); opacity: 0; }
    .sb-flyout-open .sb-flyout-inner { transform: translateX(0%); opacity: 1; transition: transform 320ms cubic-bezier(.2,.9,.2,1) 40ms, opacity 240ms ease-in 40ms; }
  `;

  return (
    <>
      {/* Main flyout component */}
      {flyoutMode === 'floating' && flyoutOpen ? (
        ReactDOM.createPortal(
          <div
            ref={ref}
            className={`flyout-container floating transition-all ease-in-out duration-300 fixed z-50 bg-gray-50 border-r shadow-xl sb-flyout-open ${isTransitioning ? 'opacity-50' : 'opacity-100'
              }`}
            style={flyoutStyle}
          >
            <style>{slideStyles}</style>
            {renderFlyoutContent()}
          </div>,
          document.body
        )
      ) : flyoutMode === 'layout' && flyoutOpen ? (
        <div
          ref={ref}
          className={`flyout-content bg-gray-50 border-r shadow-inner layout transition-all ease-in-out duration-300 h-full flex flex-col sb-flyout-open ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
        >
          <style>{slideStyles}</style>
          {renderFlyoutContent()}
        </div>
      ) : null}

      {/* Modals - Portal to document.body */}
      {showCreateBaseWorkspaceId && ReactDOM.createPortal(
        <CreateBaseModal
          isOpen={!!showCreateBaseWorkspaceId}
          onClose={() => setShowCreateBaseWorkspaceId(null)}
          workspaceId={showCreateBaseWorkspaceId}
          onCreate={async ({ name, description, image }) => {
            try {
              await handleCreateBaseForWorkspace({ name, description, image });
              setShowCreateBaseWorkspaceId(null);
            } catch (err) {
              console.error('Failed to create base:', err);
              toast.error('Failed to create base. Please try again.', { title: 'Error' });
            }
          }}
        />,
        document.body
      )}

      {showCreateTableBaseId && ReactDOM.createPortal(
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <Loader />
          </div>
        }>
          <CreateTableModal
            isOpen={!!showCreateTableBaseId}
            onClose={() => setShowCreateTableBaseId(null)}
            baseId={showCreateTableBaseId}
            existingTables={(baseTables && typeof baseTables === 'object' && 'data' in baseTables && Array.isArray((baseTables as any).data)) ? (baseTables as any).data : []}
            onCreate={async ({ name, description }) => {
              try {
                // Get the count of existing tables to set order_index
                const existingTables = (baseTables && typeof baseTables === 'object' && 'data' in baseTables && Array.isArray((baseTables as any).data)) ? (baseTables as any).data : [];
                const order_index = existingTables.length;

                const newTable = await createTableMutation.mutateAsync({
                  base_id: showCreateTableBaseId,
                  workspace_id: selectedWorkspaceId || effectiveSelectedWorkspace?.id || '',
                  title: name,
                  description: description || '',
                  order_index
                });

                // Persist navigation and navigate to the newly created table
                try {
                  const workspaceId = selectedWorkspaceId || effectiveSelectedWorkspace?.id || '';
                  if (workspaceId && showCreateTableBaseId && newTable && typeof newTable === 'object' && 'data' in newTable && (newTable as any).data?.id) {
                    // Use the provided navigation function to update URL
                    navigateToTable(workspaceId, showCreateTableBaseId, (newTable as any).data.id);
                  }
                } catch (navErr) {
                  console.warn('Navigation after table create failed', navErr);
                }

                setShowCreateTableBaseId(null);
              } catch (err) {
                console.error('Failed to create table:', err);
                toast.error('Failed to create table. Please try again.', { title: 'Error' });
              }
            }}
          />
        </Suspense>,
        document.body
      )}

      {showCreateViewModal && (() => {
        const tableId = showCreateViewModal.tableId;

        // Find the table to get its fields
        const tables = (baseTables && typeof baseTables === 'object' && 'data' in baseTables && Array.isArray((baseTables as any).data)) ? (baseTables as any).data : [];
        const tableEntry = tables.find((t: any) =>
          (t?.model?.id === tableId) || (t?.id === tableId)
        );
        // Prefer columns if present; fallback to fields if API provides that shape
        const fields = tableEntry?.columns || tableEntry?.fields || tableEntry?.model?.columns || [];

        return ReactDOM.createPortal(
          <CreateViewModalWrapper
            tableId={tableId}
            viewType={showCreateViewModal.viewType}
            fields={fields}
            onClose={() => setShowCreateViewModal(null)}
            onCreate={async ({ name, description, type, fieldId, startDateFieldId, endDateFieldId }) => {
              // Find base_id for the selected table
              const tables = (baseTables && typeof baseTables === 'object' && 'data' in baseTables && Array.isArray((baseTables as any).data)) ? (baseTables as any).data : [];
              const tableObj = tables.find((t: any) => t.model.id === showCreateViewModal.tableId);
              const base_id = tableObj?.model?.base_id || selectedBaseId;
              const payload: any = {
                model_id: showCreateViewModal.tableId,
                base_id,
                title: name,
                description: description || '',
                type: type,
              };
              // Handle different view types with their specific field configurations
              const normalizedFieldId = (fieldId && typeof fieldId === 'object') ? (fieldId as any).value : fieldId;
              const normalizedStartDateFieldId = (startDateFieldId && typeof startDateFieldId === 'object') ? (startDateFieldId as any).value : startDateFieldId;
              const normalizedEndDateFieldId = (endDateFieldId && typeof endDateFieldId === 'object') ? (endDateFieldId as any).value : endDateFieldId;

              if (String(type).toLowerCase() === 'calendar' && normalizedFieldId) {
                payload.meta = { date_field_id: String(normalizedFieldId) };
              } else if (String(type).toLowerCase() === 'kanban' && normalizedFieldId) {
                payload.meta = { view_target_field: String(normalizedFieldId) };
              } else if (String(type).toLowerCase() === 'gallery' && normalizedFieldId) {
                payload.meta = { attachment_field_id: String(normalizedFieldId) };
              } else if (String(type).toLowerCase() === 'ganttchart' && normalizedStartDateFieldId && normalizedEndDateFieldId) {
                payload.meta = {
                  start_date_field_id: String(normalizedStartDateFieldId),
                  end_date_field_id: String(normalizedEndDateFieldId)
                };
              } else {
                payload.meta = {};
              }
              try {
                await createViewMutation.mutateAsync(payload);
                setShowCreateViewModal(null);
                toast.success('View created successfully');
                // React Query mutations already invalidate view queries, so this is redundant but harmless
                setViewsRefetchTrigger(prev => prev + 1);
              } catch (err) {
                console.error('Failed to create view:', err);
                toast.error('Failed to create view. Please try again.', { title: 'Error' });
              }
            }}
          />,
          document.body
        );
      })()}

      {/* Import Table Modal */}
      {showImportModal && selectedImportType && selectedBase?.id && effectiveSelectedWorkspace?.id && ReactDOM.createPortal(
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <Loader />
          </div>
        }>
          <ImportModal
            isOpen={showImportModal}
            onClose={() => {
              setShowImportModal(false);
              setSelectedImportType(null);
            }}
            importType={selectedImportType}
            baseId={selectedBase.id}
            workspaceId={effectiveSelectedWorkspace.id}
            existingTables={(baseTables && typeof baseTables === 'object' && 'data' in baseTables && Array.isArray((baseTables as any).data)) ? (baseTables as any).data : []}
            onSuccess={() => {
              setShowImportModal(false);
              setSelectedImportType(null);
              toast.success('Table imported successfully');
            }}
          />
        </Suspense>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

