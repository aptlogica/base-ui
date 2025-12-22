import React, { useState, useRef, useEffect } from 'react';
import WorkspaceDropdown from '../../plugins/WorkspacePlugin/components/WorkspaceDropdown';
import { useWorkspaceBusinessLogic } from '../../plugins/WorkspacePlugin/data/workspaceBusinessLogic';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';

const HeaderWorkspaceDropdown: React.FC = () => {
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logoButtonRef = useRef<HTMLDivElement>(null);

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.WORKSPACE_DROPDOWN);

  // Update dropdown positioning when it opens
  useEffect(() => {
    if (workspaceDropdownOpen && buttonRef.current) {
      // The WorkspaceDropdown uses fixed positioning, so we need to adjust it
      // We'll use CSS custom properties or inline styles to position it
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdown = document.querySelector('[data-workspace-dropdown]') as HTMLElement;
      if (dropdown) {
        dropdown.style.top = `${rect.bottom + 8}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
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

  // Route-based visibility check
  if (!isRouteVisible) {
    return null;
  }

  return (
    <>
      {/* Separator */}
      <div className="h-6 w-px border"></div>
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
          {workspaceDropdownOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform flex-shrink-0" />
          )}
        </button>

        <WorkspaceDropdown
          isOpen={workspaceDropdownOpen}
          onClose={() => setWorkspaceDropdownOpen(false)}
          logoButtonRef={logoButtonRef}
          workspaceData={workspaces || []}
          selectedWorkspace={displayWorkspace}
          onWorkspaceSelect={(workspace) => {
            setSelectedWorkspace(workspace);
            setWorkspaceDropdownOpen(false);
          }}
          onCreateWorkspace={() => setShowCreateWorkspace(true)}
          showCreateWorkspace={showCreateWorkspace}
          newWorkspaceName={newWorkspaceName}
          setNewWorkspaceName={setNewWorkspaceName}
          newWorkspaceDescription={newWorkspaceDescription}
          setNewWorkspaceDescription={setNewWorkspaceDescription}
          workspaceError={workspaceError}
          onSubmitCreateWorkspace={handleFormSubmit}
          onCloseCreateWorkspace={() => setShowCreateWorkspace(false)}
        />
      </div>
    </>
  );
};

export default HeaderWorkspaceDropdown;

