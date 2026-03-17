// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceBusinessLogic } from '../../hooks/workspace/useWorkspaceBusinessLogic';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';
import { useNavigationStore } from '../../stores/navigationStore';
import { useNavigation } from '../../hooks/useNavigation';
import { CreateWorkspaceModal } from '../modals/CreateWorkspaceModal';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { getRoleLabel } from '../../types/roles';
import { getInitials } from '../../utils/helpers';

const getAccessLevelBadgeClasses = (accessLevel: string | undefined): string => {
  if (!accessLevel) {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
  
  if (accessLevel === 'workspace-read' || accessLevel === 'base-read') {
    return 'bg-green-50 text-green-700 border-green-200';
  }
  
  if (accessLevel === 'base') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  
  if (accessLevel === 'maintainer') {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const HeaderWorkspaceDropdown: React.FC = () => {
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logoButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setWorkspace, selectedBaseId } = useNavigationStore();
  const { navigateToWorkspace } = useNavigation();

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.WORKSPACE_DROPDOWN);

  // Update dropdown positioning when it opens
  useEffect(() => {
    if (workspaceDropdownOpen && buttonRef.current) {
      // The dropdown uses fixed positioning, so we need to adjust it
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdown = document.querySelector('[data-workspace-dropdown]') as HTMLElement;
      if (dropdown) {
        dropdown.style.top = `${rect.bottom + 8}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
  }, [workspaceDropdownOpen]);

  // Outside click handler - exclude logo button
  useEffect(() => {
    if (!workspaceDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking on the logo button
      if (logoButtonRef?.current?.contains(target)) {
        return;
      }
      // Close if clicking outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workspaceDropdownOpen]);

  const {
    workspaces,
    selectedWorkspace,
    selectedWorkspaceId,
    setSelectedWorkspace,
    showCreateWorkspace,
    setShowCreateWorkspace,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceDescription,
    setNewWorkspaceDescription,
    workspaceError,
    handleFormSubmit,
  } = useWorkspaceBusinessLogic();

  // Access hooks after selectedWorkspaceId is available
  const { canCreateWorkspace, isWorkspaceReadOnly } = useWorkspaceAccess(selectedWorkspaceId || undefined);
  const { isBaseReadOnly } = useBaseAccess(selectedBaseId || undefined);

  // Derive the selected workspace immediately from selectedWorkspaceId and workspaces
  // This ensures we show the workspace name even before selectedWorkspace state is set
  // Also handles newly created workspaces that might not be in the workspaces array yet
  const displayWorkspace = React.useMemo(() => {
    // Priority 1: Find workspace in workspaces array by selectedWorkspaceId (always use latest from query)
    // This ensures the header updates when workspace name is updated
    if (selectedWorkspaceId && workspaces && Array.isArray(workspaces)) {
      const found = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);
      if (found) return found;
    }
    // Priority 2: Use selectedWorkspace if available (handles newly created workspaces not yet in query)
    if (selectedWorkspace) {
      // Verify it matches the selectedWorkspaceId
      if (selectedWorkspace.id === selectedWorkspaceId) {
        return selectedWorkspace;
      }
    }
    // FALLBACK: If no workspace is selected but workspaces are available, return first one for display
    // The actual selection will be handled by the useEffect below
    if (workspaces && Array.isArray(workspaces) && workspaces.length > 0) {
      return workspaces[0];
    }
    return null;
  }, [selectedWorkspace, selectedWorkspaceId, workspaces]);

  // FALLBACK: Ensure a workspace is always selected when workspaces are available
  // This handles cases where workspace selection gets lost due to errors or other issues
  React.useEffect(() => {
    if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) return;

    // If no workspace is selected but workspaces are available, select the first one
    if (!selectedWorkspace && !selectedWorkspaceId) {
      const firstWorkspace = workspaces[0];
      setSelectedWorkspace(firstWorkspace);
      setWorkspace(firstWorkspace.id);
      return;
    }

    // If selectedWorkspaceId exists but workspace is not found in list, select first one
    if (selectedWorkspaceId && !workspaces.some((ws: any) => ws.id === selectedWorkspaceId)) {
      const firstWorkspace = workspaces[0];
      setSelectedWorkspace(firstWorkspace);
      setWorkspace(firstWorkspace.id);
      return;
    }

    // Sync selectedWorkspace with updated workspace data from query (handles name updates)
    // This ensures selectedWorkspace state stays in sync when workspace is updated
    if (selectedWorkspaceId) {
      const found = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);
      if (found) {
        // Update selectedWorkspace if it's null or if workspace data has changed (e.g., name update)
        if (!selectedWorkspace ||
          selectedWorkspace.id !== found.id ||
          selectedWorkspace.title !== found.title ||
          selectedWorkspace.name !== found.name) {
          setSelectedWorkspace(found);
        }
      }
    }
  }, [workspaces, selectedWorkspace, selectedWorkspaceId, setSelectedWorkspace, setWorkspace]);

  // Get workspace initials and color
  const getWorkspaceIcon = (workspace: any, index: number) => {
    if (!workspace) return { initials: 'WS', color: 'bg-gray-400' };

    const initials = getInitials(
      workspace.title || workspace.name || workspace.slug || 'W',
      'WS'
    );

    // Color mapping for workspace icons
    const colors = [
      'bg-purple-400', // Design Workspace
      'bg-red-400',   // Testing Workspace
      'bg-orange-400', // Development Workspace
      'bg-blue-400',
      'bg-green-400',
    ];

    // Try to match workspace name to color, otherwise use index
    const title = (workspace.title || workspace.name || '').toLowerCase();
    let color = colors[index % colors.length];

    if (title.includes('design')) color = 'bg-purple-400';
    else if (title.includes('test')) color = 'bg-red-400';
    else if (title.includes('dev')) color = 'bg-orange-400';

    return { initials, color };
  };

  const workspaceIcon = getWorkspaceIcon(displayWorkspace, workspaces?.findIndex((w: any) => w.id === displayWorkspace?.id) || 0);

  // Handle workspace selection
  const handleWorkspaceClick = (workspace: any) => {
    // Set the selected workspace
    setSelectedWorkspace(workspace);

    // Always navigate to the workspace homepage to ensure URL is updated
    // This works whether we're on homepage or a view - we want to go to the new workspace homepage
    navigateToWorkspace(workspace.id);

    setWorkspaceDropdownOpen(false);

    // Dispatch custom event for sidebar to handle base auto-selection
    globalThis.dispatchEvent(new CustomEvent('workspace-selected', {
      detail: { workspace, shouldAutoSelectBase: true }
    }));
  };

  // Route-based visibility check
  if (!isRouteVisible) {
    return null;
  }

  return (
    <>
      {/* Separator */}
      <div className="h-6 w-px bg-gray-300"></div>
      <div className="relative" ref={logoButtonRef}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setWorkspaceDropdownOpen(!workspaceDropdownOpen);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border truncate bg-card hover:bg-gray-100 transition-colors"
        >
          {/* Workspace Icon */}
          {displayWorkspace ? (
            <div className={`w-8 h-8 ${workspaceIcon.color} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-[10px]">
                {workspaceIcon.initials}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-200 border rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-[10px]">S</span>
            </div>
          )}

          {/* Workspace Name */}
          <span className="text-sm font-medium text-left text-primary max-w-44 truncate">
            {displayWorkspace?.title || displayWorkspace?.name || 'Select Workspace'}
          </span>

          {/* Read Only Tag */}
          {(isWorkspaceReadOnly() || isBaseReadOnly()) && (
            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border flex-shrink-0">
              Read only
            </span>
          )}

          {/* Dropdown Icon - chevron up when open */}
          <ChevronsUpDown className="w-4 h-4 text-tertiary transition-transform flex-shrink-0" />
        </button>

        {/* Workspace Dropdown */}
        <div
          ref={dropdownRef}
          data-workspace-dropdown
          className={`fixed top-0 left-3.5 w-96 bg-card border rounded-xl shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${workspaceDropdownOpen
            ? 'opacity-100 max-h-96 scale-100'
            : 'opacity-0 max-h-0 scale-95 pointer-events-none'
            }`}
        >
          <div className="flex flex-col" style={{ minHeight: '200px', maxHeight: '384px' }}>
            {/* Workspaces Header */}
            <div className="px-4 py-2 flex-shrink-0">
              <div className="text-xs font-semibold text-primary tracking-wide">Workspaces</div>
            </div>

            {/* Workspaces Section - scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0 p-2" >
              {workspaces && Array.isArray(workspaces) && workspaces.length > 0 ? (
                workspaces.map((workspace: any, index: number) => {
                  const isSelected = (displayWorkspace?.id || selectedWorkspaceId) === workspace.id;
                  const workspaceInitials = getInitials(
                    workspace.title || workspace.name || workspace.slug || 'W'
                  );

                  // Color mapping for workspace icons
                  const colors = [
                    'bg-purple-300',
                    'bg-red-300',
                    'bg-orange-300',
                    'bg-blue-300',
                    'bg-green-300',
                  ];
                  const textColors = [
                    'text-purple-800',
                    'text-red-800',
                    'text-orange-800',
                    'text-blue-800',
                    'text-green-800',
                  ];
                  const iconColor = colors[index % colors.length];
                  const textColor = textColors[index % textColors.length];
                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      aria-pressed={isSelected}
                      className="w-full rounded-lg text-left p-1.5 hover:bg-gray-100 text-sm transition-all duration-200 cursor-pointer"
                      onClick={() => handleWorkspaceClick(workspace)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Workspace Icon */}
                        <div className={`w-10 h-10 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className={`${textColor} text-center font-semibold text-[10px] text-base`}>
                            {workspaceInitials}
                          </span>
                        </div>

                        {/* Workspace Name */}
                        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                          <span className="font-semibold text-primary truncate flex-1 min-w-0">
                            {workspace.title || workspace.name || workspace.slug || 'Untitled Workspace'}
                          </span>

                          {/* Right side: Badge and Status Indicator */}
                          <div className="flex items-center gap-2 flex-shrink-0 pr-2">
                            {/* Access Level Badge - Don't show for owner/co-owner */}
                            {workspace.access_level && workspace.access_level !== 'owner' && workspace.access_level !== 'co-owner' && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getAccessLevelBadgeClasses(workspace.access_level)}`}>
                                {getRoleLabel(workspace.access_level)}
                              </span>
                            )}

                            {/* Status Indicator - only for selected */}
                            {isSelected && (
                              <div className="w-2 h-2 bg-green-500 rounded-full ring ring-green-100"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-secondary text-sm">
                  {workspaces === null ? (
                    <div>Loading workspaces...</div>
                  ) : (
                    <div>No workspaces found</div>
                  )}
                </div>
              )}
            </div>

            {/* Separator - only show if there are workspaces and user can create */}
            {workspaces && workspaces.length > 0 && canCreateWorkspace() && (
              <div className="border-t flex-shrink-0"></div>
            )}

            {/* Create Workspace Button - only show if user has permission */}
            {canCreateWorkspace() && (
              <div className="p-2 flex-shrink-0">
                <button
                  className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-gray-100 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1"
                  onClick={() => {
                    setShowCreateWorkspace(true);
                    setWorkspaceDropdownOpen(false);
                  }}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Workspace Modal */}
        <CreateWorkspaceModal
          isOpen={showCreateWorkspace}
          onClose={() => setShowCreateWorkspace(false)}
          name={newWorkspaceName}
          setName={setNewWorkspaceName}
          description={newWorkspaceDescription}
          setDescription={setNewWorkspaceDescription}
          error={workspaceError}
          onSubmit={async (e?: React.SyntheticEvent<HTMLFormElement>) => {
            e?.preventDefault();
            await handleFormSubmit(e as React.SyntheticEvent<HTMLFormElement>);
          }}
        />
      </div>
    </>
  );
};

export default HeaderWorkspaceDropdown;

