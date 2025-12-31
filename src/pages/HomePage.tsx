import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Download, Search, Zap, Database, ChevronDown } from 'lucide-react';
import { useWorkspaceBases, useCreateBase, useUpdateBase, useDeleteBase } from '../hooks/useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { useNavigationActions } from '../hooks/useNavigationActions';
import { Loader } from '../components/ui/Loader';
import { CreateBaseModal } from '../components/modals/CreateBaseModal';
import { ImportDataModal } from '../components/modals/ImportDataModal';
import { ImportModal } from '../components/modals/ImportModal';
import { EditItemModal } from '../components/modals/EditItemModal';
import { AddBaseMembersModal } from '../components/modals/AddBaseMembersModal';
import { BaseMenu } from '../components/common/BaseMenu';

// Wrapper component to handle hooks properly
const BaseMenuWrapper: React.FC<{
  base: any;
  onEdit: (base: any) => void;
  onAddMembers: (base: any) => void;
  onDelete: (base: any) => void;
}> = ({ base, onEdit, onAddMembers, onDelete }) => {
  const { canUpdateBase, canDeleteBase, canAssignUsers } = useWorkspaceAccess(base.workspace_id);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <BaseMenu
        base={base}
        onEdit={onEdit}
        onAddMembers={onAddMembers}
        onDelete={onDelete}
        canEdit={canUpdateBase()}
        canDelete={canDeleteBase()}
        canAddMembers={canAssignUsers()}
      />
    </div>
  );
};
import { useToast } from '../components/common/Toast';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { formatRelativeDate } from '../utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, getUserDisplayName } from '../auth/useCurrentUser';
import { useNavigateToBaseFirstView } from '../hooks/useNavigateToBaseFirstView';

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedWorkspaceId } = useNavigationStore();
  const { data: workspaceBasesData, isLoading: basesLoading } = useWorkspaceBases(selectedWorkspaceId || '');
  const toast = useToast();
  const { canCreateBase, accessLevel, isWorkspaceReadOnly, isBaseLevelAccess } = useWorkspaceAccess(selectedWorkspaceId || undefined);
  const createBaseMutation = useCreateBase();
  const { navigateToFirstView } = useNavigateToBaseFirstView();

  // Extract bases array from workspaceBases response
  const allBases = useMemo(() => {
    const data = workspaceBasesData as any;
    if (!data?.data) return [];
    const bases = Array.isArray(data.data) ? data.data : [];
    
    // If workspace access is "base", filter to only show bases user has access to
    if (isBaseLevelAccess()) {
      return bases.filter((base: any) => {
        const baseAccess = base?.access_level?.toLowerCase();
        // Show bases where user has any valid access level
        return baseAccess === 'owner' || 
               baseAccess === 'maintainer' || 
               baseAccess === 'base-member' || 
               baseAccess === 'base-read' ||
               baseAccess === 'workspace-read';
      });
    }
    
    // For owner/co-owner/maintainer, show all bases
    return bases;
  }, [workspaceBasesData, isBaseLevelAccess]);

  const [showCreateBase, setShowCreateBase] = useState(false);
  const [showImportData, setShowImportData] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<'csv' | 'excel' | 'sql' | 'json' | 'airtable' | 'nocodb' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'recent' | 'a-z' | 'z-a'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [editingBase, setEditingBase] = useState<any | null>(null);
  const [deletingBase, setDeletingBase] = useState<any | null>(null);
  const [baseNameToDelete, setBaseNameToDelete] = useState('');
  const [isDeletingBase, setIsDeletingBase] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [baseForMembers, setBaseForMembers] = useState<any | null>(null);

  const updateBaseMutation = useUpdateBase();
  const deleteBaseMutation = useDeleteBase();
  const { handleBaseDeletion } = useNavigationActions();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  // Filter and sort bases based on search term and sort option
  const filteredBases = useMemo(() => {
    if (!allBases || !Array.isArray(allBases)) return [];

    let filtered = allBases;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = allBases.filter((base: any) => {
        const title = (base.title || base.name || '').toLowerCase();
        const description = (base.description || '').toLowerCase();
        return title.includes(term) || description.includes(term);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortOption === 'recent') {
        // Sort by updated_time or created_time (most recent first)
        const aTime = new Date(a.updated_time || a.created_time || 0).getTime();
        const bTime = new Date(b.updated_time || b.created_time || 0).getTime();
        return bTime - aTime;
      } else if (sortOption === 'a-z') {
        const aTitle = (a.title || a.name || '').toLowerCase();
        const bTitle = (b.title || b.name || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      } else if (sortOption === 'z-a') {
        const aTitle = (a.title || a.name || '').toLowerCase();
        const bTitle = (b.title || b.name || '').toLowerCase();
        return bTitle.localeCompare(aTitle);
      }
      return 0;
    });

    return sorted;
  }, [allBases, searchTerm, sortOption]);

  const handleBaseClick = async (base: any) => {
    try {
      await navigateToFirstView(base.id);
    } catch (error: any) {
      console.error('Failed to navigate to base:', error);
      toast.error(error?.message || 'Failed to navigate to base. Please try again.');
    }
  };

  const handleEditBase = (base: any) => {
    setEditingBase(base);
  };

  const handleSaveBase = async ({ name, description }: { name: string; description: string }) => {
    if (!editingBase) return;

    try {
      const updates: any = {};
      if (name !== (editingBase.title || editingBase.name)) {
        updates.title = name;
      }
      if (description !== (editingBase.description || '')) {
        updates.description = description;
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        setEditingBase(null);
        return;
      }

      await updateBaseMutation.mutateAsync({ baseId: editingBase.id, updates });
      toast.success('Base updated successfully');
      setEditingBase(null);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });
    } catch (err: any) {
      console.error('Failed to update base:', err);
      toast.error(err?.message || 'Failed to update base. Please try again.');
    }
  };

  const handleDeleteBase = (base: any) => {
    setDeletingBase(base);
    setBaseNameToDelete('');
    setIsDeletingBase(false);
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
    } catch (err: any) {
      console.error('Failed to delete base:', err);
      toast.error(err?.message || 'Failed to delete base. Please try again.');
    }
  };

  const handleAddMembers = (base: any) => {
    setBaseForMembers(base);
    setShowAddMembers(true);
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

      // Invalidate queries to refresh the bases list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base created successfully');
      setShowCreateBase(false);

      // Navigate to the new base
      const baseId = (newBase as any)?.data?.id;
      if (baseId) {
        // COMMENTED OUT: Navigation to table on base creation
        // try {
        //   // Update navigation store first
        //   const { navigateToBase } = useNavigationStore.getState();
        //   navigateToBase(selectedWorkspaceId, baseId);

        //   // Try to navigate to first view, but fallback to base page if no tables exist
        //   await navigateToFirstView(baseId);
        // } catch (err) {
        //   console.error('Navigation error after base creation:', err);
        //   // Fallback: navigate directly to base page
        //   const { navigateToBase } = useNavigationStore.getState();
        //   navigateToBase(selectedWorkspaceId, baseId);
        //   navigate(`/base/${baseId}`);
        // }
      } else {
        console.error('Base created but no ID in response:', newBase);
        // If no ID, just refresh the homepage
        // navigate('/homepage');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create base. Please try again.');
    }
  };

  const handleImportTypeSelect = (importType: string) => {
    if (importType === 'csv') {
      setSelectedImportType('csv');
      setShowImportModal(true);
    } else {
      toast.info(`${importType.toUpperCase()} import will be available soon`);
    }
  };

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
      letter: firstLetter,
      color
    };
  };

  const formatLastModified = (dateString: string | null | undefined) => {
    if (!dateString) return 'Last modified Unknown';
    const relative = formatRelativeDate(dateString);
    // Return in format "Last modified X ago" where X will be made bold
    return `Last modified ${relative}`;
  };

  const currentUser = useCurrentUser();
  const userName = getUserDisplayName(currentUser);

  if (basesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader text="Loading bases..." textPosition="bottom" />
      </div>
    );
  }

  // Show message if no workspace is selected
  if (!selectedWorkspaceId) {
    return (
      <div className="relative overflow-hidden h-full bg-background">
        <div className="p-8 md:p-12 lg:p-16">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-4">
              Welcome
            </h1>
            <p className="text-lg text-primary max-w-2xl">
              We've created intuitive interfaces efficiently and effortlessly to help you manage your data.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Please select a workspace</h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Select a workspace from the dropdown in the header to view your bases.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      {/* Welcome Banner Section */}
      <div className="rounded-2xl relative overflow-hidden p-6 md:p-8 lg:p-10 mb-8">
        {/* Rotated Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/assets/home_header_bg.png)',
            // transform: 'rotate(-13.85deg)',
            // transformOrigin: 'center center',
            // width: '100%',
            // height: '200%',
          }}
        />
        {/* Content with relative positioning */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          {/* Left Side - Welcome Message */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-normal text-black mb-3">
              Welcome back, <span className="text-3xl font-semibold text-black">{userName}</span> 👋
            </h1>
            <p className="text-base md:text-lg text-black max-w-2xl">
              We've prepared quick actions to help you create interfaces efficiently and effortlessly.
            </p>
          </div>

          {/* Right Side - Action Cards */}
          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full lg:w-auto">
            {/* Create New Base - Hidden if access level is base-member */}
            {accessLevel !== 'limited_access' && (
              <div
                onClick={() => {
                  if (!selectedWorkspaceId) {
                    toast.error('Please select a workspace first');
                    return;
                  }
                  if (!canCreateBase()) {
                    toast.error('You do not have permission to create bases');
                    return;
                  }
                  setShowCreateBase(true);
                }}
                className="rounded-xl bg-card border px-5 py-5 flex flex-col items-start cursor-pointer hover:shadow-md transition-all duration-200 w-full sm:w-auto sm:min-w-[250px]"
              >
                <div className="w-10 h-10 rounded-xl bg-card border flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-gray-900" />
                </div>
                <div className="font-semibold text-sm text-gray-900 mb-0.5">Create New Base</div>
                <div className="text-xs text-gray-600">Creates a new base.</div>
              </div>
            )}

            {/* Import Data - Hidden if access level is base-member */}
            {accessLevel !== 'limited_access' && (
              <div
                onClick={() => setShowImportData(true)}
                className="rounded-xl bg-card border px-5 py-5 flex flex-col items-start cursor-pointer hover:shadow-md transition-all duration-200 w-full sm:w-auto sm:min-w-[250px]"
              >
                <div className="w-10 h-10 rounded-xl bg-card border flex items-center justify-center mb-3">
                  <Download className="w-5 h-5 text-gray-900" />
                </div>
                <div className="font-semibold text-sm text-gray-900 mb-0.5">Import Data</div>
                <div className="text-xs text-gray-600">Bring in external data.</div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* All Bases Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center border-b justify-between gap-4 py-5 mb-5">
          <h2 className="text-2xl font-semibold text-primary">All Bases</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-[var(--color-focus-ring)] focus-within:border-[var(--color-focus-ring)] outline-none transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-gray-400"
                />
              </div>
            </div>

            {/* Recents Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                ref={sortButtonRef}
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-xl bg-card transition-all duration-200 whitespace-nowrap ${isSortDropdownOpen
                  ? 'border-primary ring-1 ring-primary ring-opacity-20'
                  : 'border hover:border-gray-400'
                  }`}
              >
                <span className="font-medium text-primary">
                  {sortOption === 'recent' ? 'Recents' : sortOption === 'a-z' ? 'A-Z' : 'Z-A'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSortOption('recent');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full rounded-xl text-left p-2 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary">Recent</span>
                        {sortOption === 'recent' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('a-z');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full rounded-xl text-left p-2 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary">A-Z</span>
                        {sortOption === 'a-z' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('z-a');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full rounded-xl text-left p-2 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary">Z-A</span>
                        {sortOption === 'z-a' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bases Grid */}
        {filteredBases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bases found</h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              {searchTerm ? 'No bases match your search. Try a different term.' : 'You don\'t have any bases yet. Create your first base to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBases.map((base: any, index: number) => {
              const icon = getBaseIcon(base, index);
              const lastModified = formatLastModified(base.updated_time || base.created_time);
              // Extract the time part (e.g., "30 minutes ago") to make it bold
              const timeMatch = lastModified.match(/(\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago)/i);
              const timePart = timeMatch ? timeMatch[1] : '';

              // Check for base image (same logic as breadcrumb)
              const baseImage = base.image || base.logo || base.meta?.image;
              const baseName = base.title || base.name || 'Base';

              return (
                <div
                  key={base.id}
                  className="rounded-xl bg-card border cursor-pointer hover:shadow-md transition-all duration-200 relative group"
                >
                  {/* Top Section: Icon, Title, Description, Menu */}
                  <div className="flex items-start gap-3 border-b p-5">
                    {/* Icon on left - Use image if available, otherwise use initial with colored background */}
                    {baseImage ? (
                      <div className="w-12 h-12 border rounded-xl overflow-hidden flex-shrink-0 shadow-xs">
                        <img
                          src={baseImage}
                          alt={baseName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 border rounded-xl ${icon.color} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-xs`}>
                        {icon.letter}
                      </div>
                    )}

                    {/* Title and Description on right of icon */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          onClick={() => handleBaseClick(base)}
                          className="font-semibold text-base text-gray-900 leading-tight"
                        >
                          {base.title || base.name || 'Untitled Base'}
                        </h3>
                        {isWorkspaceReadOnly() ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">Read Only</span>
                        ) : (
                          <BaseMenuWrapper
                            base={base}
                            onEdit={handleEditBase}
                            onAddMembers={handleAddMembers}
                            onDelete={handleDeleteBase}
                          />
                        )}
                      </div>
                      <p
                        onClick={() => handleBaseClick(base)}
                        className="text-sm text-gray-600 line-clamp-1 leading-relaxed"
                      >
                        {base.description || 'Base for general purpose work.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Section: Last Modified */}
                  <div
                    onClick={() => handleBaseClick(base)}
                    className="text-xs text-gray-600 p-5"
                  >
                    {timePart ? (
                      <>
                        <span className="text-gray-600">Last modified </span>
                        <span className="font-semibold text-gray-700">{timePart}</span>
                      </>
                    ) : (
                      <span>{lastModified}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Modals */}
      {showCreateBase && selectedWorkspaceId && (
        <CreateBaseModal
          isOpen={showCreateBase}
          onClose={() => setShowCreateBase(false)}
          onCreate={handleCreateBase}
          workspaceId={selectedWorkspaceId}
          existingBases={allBases || []}
        />
      )}

      <ImportDataModal
        isOpen={showImportData}
        onClose={() => setShowImportData(false)}
        onSelectImportType={handleImportTypeSelect}
      />

      {selectedImportType && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setSelectedImportType(null);
          }}
          onSuccess={() => {
            setShowImportModal(false);
            setSelectedImportType(null);
          }}
          importType={selectedImportType}
          baseId={''}
          workspaceId={selectedWorkspaceId || ''}
          existingTables={[]}
        />
      )}

      {/* Edit Base Modal */}
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
          existingItems={allBases.map((b: any) => ({
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
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
            toast.success('Members added successfully');
          }}
          workspaceId={baseForMembers.workspace_id || selectedWorkspaceId || ''}
          baseId={baseForMembers.id}
        />
      )}
    </div>
  );
};

export default HomePage;
