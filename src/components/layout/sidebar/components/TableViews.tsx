import React from 'react';
import { VIEW_ICONS } from '../../../../types/viewTypes';
import ViewOptionsMenu from '../../../../components/views/ViewOptionsMenu';
import { CreateViewButton } from './CreateViewButton';
import { TableViewsProps } from '../types';
import { useUpdateTable } from '../../../../hooks/useApi';
import { Pin } from 'lucide-react';
import { useWorkspaceAccess } from '../../../../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';

interface PinnedViews {
  [viewId: string]: boolean;
}

export const TableViews: React.FC<TableViewsProps> = ({
  table,
  views = [], // Accept views as prop instead of fetching
  navigateToView,
  isViewActive,
  handleViewDeletion,
  setShowCreateViewModal,
  setEditingViewId,
  setPopoverRef,
  setViewsRefetchTrigger
}) => {
  const updateTable = useUpdateTable();
  const { isWorkspaceReadOnly } = useWorkspaceAccess(table.workspace_id);
  const { canCreateView } = useBaseAccess(table.base_id);
  const [pinnedViews, setPinnedViews] = React.useState<PinnedViews>(() => {
    return table.meta?.pinnedViews || {};
  });

  // Use ref to track the latest pinnedViews without triggering effect
  const pinnedViewsRef = React.useRef(pinnedViews);
  React.useEffect(() => {
    pinnedViewsRef.current = pinnedViews;
  }, [pinnedViews]);

  // Clean up orphaned pinned view IDs when views change
  React.useEffect(() => {
    if (!views || views.length === 0) {
      // If no views, clear all pinned views
      if (Object.keys(pinnedViewsRef.current).length > 0) {
        setPinnedViews({});
        updateTable.mutate({
          tableId: table.id,
          params: {
            meta: {
              ...table.meta,
              pinnedViews: {},
            },
          },
        });
      }
      return;
    }

    const viewIds = new Set(views.map((v: any) => v.id));
    const orphanedIds = Object.keys(pinnedViewsRef.current).filter(viewId => !viewIds.has(viewId));

    if (orphanedIds.length > 0) {
      const cleanedPinnedViews = Object.keys(pinnedViewsRef.current).reduce((acc, viewId) => {
        if (viewIds.has(viewId)) {
          acc[viewId] = pinnedViewsRef.current[viewId];
        }
        return acc;
      }, {} as PinnedViews);

      setPinnedViews(cleanedPinnedViews);

      // Persist cleanup to table meta
      updateTable.mutate({
        tableId: table.id,
        params: {
          meta: {
            ...table.meta,
            pinnedViews: cleanedPinnedViews,
          },
        },
      });
    }
    // Only run when views change, not when pinnedViews changes
  }, [views, table.id, table.meta, updateTable]);

  const viewsData = React.useMemo(() => {
    if (!views) return [];

    return [...views].sort((a, b) => {
      const aPinned = pinnedViews[a.id] || false;
      const bPinned = pinnedViews[b.id] || false;

      if (aPinned && !bPinned) return -1; // a comes first
      if (!aPinned && bPinned) return 1;  // b comes first
      return 0; // Keep original order if both pinned or both unpinned
    });
  }, [views, pinnedViews]);

  const handlePinToggle = async (viewId: string, newStatus: boolean) => {
    const newPinnedViews = { ...pinnedViews, [viewId]: newStatus };
    setPinnedViews(newPinnedViews);

    try {
      await updateTable.mutateAsync({
        tableId: table.id,
        params: {
          meta: {
            ...table.meta,
            pinnedViews: newPinnedViews,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update pinned status:', error);
      setPinnedViews((prev) => ({
        ...prev,
        [viewId]: !newStatus,
      }));
    }
  };

  return (
    <div className="mb-2">
      {/* Create View Button - only show for admin and full_access users */}
      {canCreateView() && !isWorkspaceReadOnly() && (
        <CreateViewButton
          table={table}
          onOpenModal={(type) => {
            setShowCreateViewModal({ tableId: table.id, viewType: type });
          }}
          setPopoverRef={setPopoverRef}
        />
      )}
      {/* List of Views */}
      {viewsData.map((view: any) => {
        const viewIconInfo = VIEW_ICONS[view.type as keyof typeof VIEW_ICONS] || VIEW_ICONS.grid;
        const IconComponent = viewIconInfo.icon;
        return (
          <div
            key={view.id}
            className={`sidebar flex items-center gap-3 py-2 pr-3 pl-10 mt-1 first:mt-0 hover:bg-[var(--color-gray-100)] transition-all ease-in duration-200 rounded-xl ${isViewActive(table.base_id, table.id, view.id) ? 'bg-blue-25 ' : ''} relative`}
          >
            {/* View icon and name - click to navigate */}
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer "
              onClick={() => navigateToView(table.workspace_id, table.base_id, table.id, view.id)}
            >
              <span className="cursor-pointer h-5 w-5">
                <IconComponent size={15} style={{ color: viewIconInfo.color }} />
              </span>
              <span
                title={view.title}
                className="font-medium text-[var(--color-text-primary)] truncate max-w-[170px]"
              >
                {view.title}
              </span>
              {/* Pin indicator - always visible when pinned, tilted */}
              {pinnedViews[view.id] && (
                <Pin className="w-3 h-3 text-primary-brand fill-current rotate-45" />
              )}
            </div>
            {/* Three dots menu for view */}
            {!isWorkspaceReadOnly() && (
              <div className='flex items-center gap-2'>
                <ViewOptionsMenu
                  view={view}
                  workspaceId={table.workspace_id}
                  align="auto"
                  isPinned={pinnedViews[view.id] || false}
                  onPinToggle={handlePinToggle}
                  onRename={async (newName) => {
                    try {
                      // Trigger refetch to update UI with new view name
                      if (setViewsRefetchTrigger) {
                        setViewsRefetchTrigger(prev => prev + 1);
                      }
                    } catch (err) {
                      console.error('Failed to rename view:', err);
                    }
                  }}
                  onEditDescription={async (description) => {
                    try {
                      // Trigger refetch to update UI with new view description
                      if (setViewsRefetchTrigger) {
                        setViewsRefetchTrigger(prev => prev + 1);
                      }
                    } catch (err) {
                      console.error('Failed to update view description:', err);
                    }
                  }}
                  onDelete={async () => {
                    try {
                      // handleViewDeletion will trigger views refetch
                      // The useEffect will then clean up the pinnedViews automatically
                      handleViewDeletion(view);
                    } catch (err) {
                      console.error('Failed to delete view:', err);
                    }
                  }}
                  onEditingChange={(isEditing) => {
                    setEditingViewId(isEditing ? view.id : null);
                  }}
                  portaled={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

