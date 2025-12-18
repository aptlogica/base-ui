import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
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
    const navigate = useNavigate();
    const { selectedWorkspaceId, selectedBaseId } = useNavigationStore();
    const { navigateToWorkspace } = useNavigation();
    const { canCreateWorkspace } = useWorkspaceAccess();

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
        navigateToWorkspace(workspace.id);
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
                className={`fixed top-7 left-3.5 mt-4 w-80 bg-card border rounded-md shadow-xl z-50 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${isOpen
                    ? 'opacity-100 max-h-96 scale-100'
                    : 'opacity-0 max-h-0 scale-95 pointer-events-none'
                    }`}
            >
                <div className="p-0">
                    <div className="flex flex-col h-full">
                        {/* Workspaces Section - scrollable */}
                        <div className="text-xs text-[var(--color-text-primary)] mb-0.5 px-3 py-2 uppercase tracking-wide">Workspaces</div>
                        <div className="space-y-1 overflow-y-auto flex-1 max-h-[200px] px-2 pb-1">
                            {workspaceData && Array.isArray(workspaceData) && workspaceData.length > 0 ? (
                                workspaceData.map((workspace: any) => {
                                    const isSelected = (selectedWorkspace?.id || selectedWorkspaceId) === workspace.id;
                                    return (
                                        <div key={workspace.id} className='flex flex-col'>
                                            <div
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-[var(--color-hover-bg)] ${isSelected
                                                    ? 'bg-[var(--color-selected-bg)] text-primary border'
                                                    : 'text-primary'
                                                    }`}
                                                onClick={() => handleWorkspaceClick(workspace)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {(
                                                                workspace.title?.charAt(0) ||
                                                                workspace.name?.charAt(0) ||
                                                                workspace.slug?.charAt(0) ||
                                                                'U'
                                                            ).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                                        <div className="font-medium text-[var(--color-text-primary)] cursor-pointer truncate" style={{ maxWidth: '200px' }}>
                                                            {workspace.title || workspace.name || workspace.slug || 'Untitled Workspace'}
                                                        </div>
                                                        {/* {isSelected && (
                                                        <button
                                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-brand-primary)] text-tertiary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/workspace/${workspace.id}/settings`);
                                                                onClose();
                                                            }}
                                                            title="Workspace Settings"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    )} */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center text-gray-500 text-xs">
                                    {workspaceData === null ? (
                                        <div>Loading workspaces...</div>
                                    ) : (
                                        <div>No workspaces found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Create Workspace Button pinned to bottom - only show for admin users */}
                        {canCreateWorkspace() && (
                            <div className="border-t pt-3 px-2 pb-2 bg-card sticky bottom-0">
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded-lg transition-all duration-200 font-medium flex items-center gap-3"
                                    onClick={() => {
                                        onCreateWorkspace();
                                        onClose();
                                    }}
                                >
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-black" />
                                    </div>
                                    Create New Workspace
                                </button>
                            </div>
                        )}
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