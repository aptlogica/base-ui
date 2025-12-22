import React from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNavigationStore } from '../../../stores/navigationStore';
import { useNavigation } from '../../../hooks/useNavigation';
import { CreateWorkspaceModal } from '../../../components/modals/CreateWorkspaceModal';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

interface WorkspaceDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceData: any[];
    selectedWorkspace: any;
    onWorkspaceSelect: (workspace: any) => void;
    onCreateWorkspace: () => void;
    showCreateWorkspace: boolean;
    newWorkspaceName: string;
    setNewWorkspaceName: (name: string) => void;
    newWorkspaceDescription: string;
    setNewWorkspaceDescription: (desc: string) => void;
    workspaceError: string;
    onSubmitCreateWorkspace: (e: React.FormEvent) => void;
    onCloseCreateWorkspace: () => void;
    logoButtonRef?: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
    isOpen,
    onClose,
    workspaceData,
    selectedWorkspace,
    onWorkspaceSelect,
    onCreateWorkspace,
    showCreateWorkspace,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceDescription,
    setNewWorkspaceDescription,
    workspaceError,
    onSubmitCreateWorkspace,
    onCloseCreateWorkspace,
    logoButtonRef,
}) => {
    const location = useLocation();
    const { selectedWorkspaceId, setWorkspace } = useNavigationStore();
    const { navigateToWorkspace } = useNavigation();
    const { canCreateWorkspace } = useWorkspaceAccess();
    
    // Check if we're on the homepage
    const isHomepage = location.pathname === '/homepage' || location.pathname === '/workspace';

    // Ref for dropdown
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Outside click handler - exclude logo button
    React.useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            // Don't close if clicking on the logo button
            if (logoButtonRef?.current && logoButtonRef.current.contains(target)) {
                return;
            }
            // Close if clicking outside the dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, logoButtonRef]);


    const handleWorkspaceClick = (workspace: any) => {
        // Set the selected workspace
        onWorkspaceSelect(workspace);
        
        // If on homepage, just update the workspace in store without navigating
        if (isHomepage) {
            setWorkspace(workspace.id);
        } else {
            // Otherwise, navigate to the workspace
            navigateToWorkspace(workspace.id);
        }
        
        onClose();

        // Dispatch custom event for sidebar to handle base auto-selection
        window.dispatchEvent(new CustomEvent('workspace-selected', {
            detail: { workspace, shouldAutoSelectBase: true }
        }));
    };

    return (
        <>
            {/* Workspace Dropdown */}
            <div
                ref={dropdownRef}
                data-workspace-dropdown
                className={`fixed top-0 left-3.5 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${isOpen
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
                    <div className="overflow-y-auto flex-1 max-h-48 space-y-1 p-2">
                            {workspaceData && Array.isArray(workspaceData) && workspaceData.length > 0 ? (
                                workspaceData.map((workspace: any, index: number) => {
                                    const isSelected = (selectedWorkspace?.id || selectedWorkspaceId) === workspace.id;
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
                                            className={`w-full rounded-xl text-left px-3 py-1 text-sm transition-all duration-200 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[var(--color-bg-brand-primary)] text-black '
                                                    : 'hover:bg-[var(--color-bg-brand-primary)] hover:text-black '
                                            }`}
                                            onClick={() => handleWorkspaceClick(workspace)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Workspace Icon */}
                                                <div className={`w-8 h-8 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-white text-center font-bold text-sm">
                                                        {initials}
                                                    </span>
                                                </div>
                                                
                                                {/* Workspace Name */}
                                                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                                    <span className="font-medium text-primary truncate">
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
                                    {workspaceData === null ? (
                                        <div>Loading workspaces...</div>
                                    ) : (
                                        <div>No workspaces found</div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Separator */}
                    {workspaceData && workspaceData.length > 0 && (
                        <div className="border-t flex-shrink-0"></div>
                    )}

                    {/* Create Workspace Button - always visible at bottom */}
                    <div className="p-3 flex-shrink-0">
                        <button
                            className="w-full text-left px-3 py-1 text-sm text-primary hover:bg-muted/30 shadow-xs rounded-xl border transition-all duration-200 font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                                if (canCreateWorkspace()) {
                                    onCreateWorkspace();
                                    onClose();
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
                onClose={onCloseCreateWorkspace}
                name={newWorkspaceName}
                setName={setNewWorkspaceName}
                description={newWorkspaceDescription}
                setDescription={setNewWorkspaceDescription}
                error={workspaceError}
                onSubmit={async (e) => {
                    if (e) {
                        e.preventDefault();
                    }
                    await onSubmitCreateWorkspace(e as React.FormEvent);
                }}
            />
        </>
    );
};

export default WorkspaceDropdown;