import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkspaceBusinessLogic } from '../../hooks/workspace/useWorkspaceBusinessLogic';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';
import { useNavigationStore } from '../../stores/navigationStore';
import { useNavigation } from '../../hooks/useNavigation';
import { CreateWorkspaceModal } from '../modals/CreateWorkspaceModal';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';

const HeaderWorkspaceDropdown: React.FC = () => {
  const location = useLocation();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logoButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setWorkspace } = useNavigationStore();
  const { navigateToWorkspace } = useNavigation();
  const { canCreateWorkspace } = useWorkspaceAccess();

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.WORKSPACE_DROPDOWN);

  // Check if we're on the homepage
  const isHomepage = location.pathname === '/homepage' || location.pathname === '/workspace';

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
      if (logoButtonRef?.current && logoButtonRef.current.contains(target)) {
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

  // Derive the selected workspace immediately from selectedWorkspaceId and workspaces
  // This ensures we show the workspace name even before selectedWorkspace state is set
  const displayWorkspace = React.useMemo(() => {
    if (selectedWorkspace) return selectedWorkspace;
    if (selectedWorkspaceId && workspaces && Array.isArray(workspaces)) {
      return workspaces.find((ws: any) => ws.id === selectedWorkspaceId) || null;
    }
    return null;
  }, [selectedWorkspace, selectedWorkspaceId, workspaces]);

  // Get workspace initials and color
  const getWorkspaceIcon = (workspace: any, index: number) => {
    if (!workspace) return { initials: 'S', color: 'bg-gray-400' };
    
    const initials = (
      workspace.title?.charAt(0) ||
      workspace.name?.charAt(0) ||
      workspace.slug?.charAt(0) ||
      'U'
    ).toUpperCase();
    
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

    // If on homepage, just update the workspace in store without navigating
    if (isHomepage) {
      setWorkspace(workspace.id);
    } else {
      // Otherwise, navigate to the workspace
      navigateToWorkspace(workspace.id);
    }

    setWorkspaceDropdownOpen(false);

    // Dispatch custom event for sidebar to handle base auto-selection
    window.dispatchEvent(new CustomEvent('workspace-selected', {
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
        >
          {/* Workspace Icon */}
          {displayWorkspace ? (
            <div className={`w-8 h-8 ${workspaceIcon.color} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm">
                {workspaceIcon.initials}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-muted-foreground font-bold text-sm">S</span>
            </div>
          )}
          
          {/* Workspace Name */}
          <span className="text-sm font-medium text-primary">
            {displayWorkspace?.title || displayWorkspace?.name || 'Select Workspace'}
          </span>
          
          {/* Dropdown Icon - chevron up when open */}
          <ChevronsUpDown className="w-4 h-4 text-gray-400 transition-transform flex-shrink-0" />
        </button>

        {/* Workspace Dropdown */}
        <div
          ref={dropdownRef}
          data-workspace-dropdown
          className={`fixed top-0 left-3.5 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${workspaceDropdownOpen
            ? 'opacity-100 max-h-96 scale-100'
            : 'opacity-0 max-h-0 scale-95 pointer-events-none'
            }`}
        >
          <div className="flex flex-col h-full">
            {/* Workspaces Header */}
            <div className="px-4 py-2 flex-shrink-0">
              <div className="text-xs font-semibold text-primary tracking-wide">Workspaces</div>
            </div>

            {/* Workspaces Section - scrollable */}
            <div className="overflow-y-auto flex-1 max-h-48 p-2">
              {workspaces && Array.isArray(workspaces) && workspaces.length > 0 ? (
                workspaces.map((workspace: any, index: number) => {
                  const isSelected = (displayWorkspace?.id || selectedWorkspaceId) === workspace.id;
                  const initials = (
                    workspace.title?.charAt(0) ||
                    workspace.name?.charAt(0) ||
                    workspace.slug?.charAt(0) ||
                    'U'
                  ).toUpperCase();

                  // Color mapping for workspace icons
                  const colors = [
                    'bg-purple-400', // Design Workspace
                    'bg-red-400',   // Testing Workspace
                    'bg-orange-400', // Development Workspace
                    'bg-blue-400',
                    'bg-green-400',
                  ];
                  const iconColor = colors[index % colors.length];

                  return (
                    <div
                      key={workspace.id}
                      className="w-full rounded-lg text-left p-2 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                      onClick={() => handleWorkspaceClick(workspace)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Workspace Icon */}
                        <div className={`w-6 h-6 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-center">
                            {initials}
                          </span>
                        </div>

                        {/* Workspace Name */}
                        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                          <span className="font-semibold text-primary truncate">
                            {workspace.title || workspace.name || workspace.slug || 'Untitled Workspace'}
                          </span>

                          {/* Status Indicator - only for selected */}
                          {isSelected && (
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {workspaces === null ? (
                    <div>Loading workspaces...</div>
                  ) : (
                    <div>No workspaces found</div>
                  )}
                </div>
              )}
            </div>

            {/* Separator */}
            {workspaces && workspaces.length > 0 && (
              <div className="border-t flex-shrink-0"></div>
            )}

            {/* Create Workspace Button - always visible at bottom */}
            <div className="p-2 flex-shrink-0">
              <button
                className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-muted/30 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (canCreateWorkspace()) {
                    setShowCreateWorkspace(true);
            setWorkspaceDropdownOpen(false);
                  }
                }}
                disabled={!canCreateWorkspace()}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <span>Create Workspace</span>
              </button>
            </div>
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
          onSubmit={async (e) => {
            if (e) {
              e.preventDefault();
            }
            await handleFormSubmit(e as React.FormEvent);
          }}
        />
      </div>
    </>
  );
};

export default HeaderWorkspaceDropdown;

