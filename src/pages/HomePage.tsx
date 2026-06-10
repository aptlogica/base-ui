// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
  /* eslint-disable sonarjs/cognitive-complexity */
import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus, Import, Search, Zap, Database, ChevronDown, Sparkles } from 'lucide-react';
import { useWorkspaceBases, useCreateBase, useUpdateBase, useDeleteBase, useBaseTables, useCreateTable, useWorkspaces, useCreateBaseWithAi} from '../hooks/useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { useNavigationActions } from '../hooks/useNavigationActions';
import { Loader } from '../components/ui/Loader';
import { CreateBaseModal } from '../components/modals/CreateBaseModal';
import { CreateBaseWithAiModal } from '../components/modals/CreateBaseWithAiModal';
import { ImportDataModal } from '../components/modals/ImportDataModal';
import { ImportModal } from '../components/modals/ImportModal';
import { EditItemModal } from '../components/modals/EditItemModal';
import { AddBaseMembersModal } from '../components/modals/AddBaseMembersModal';
import { DeleteBaseModal } from '../components/modals/DeleteBaseModal';

const CreateTableModal = lazy(() =>
  import('../components/modals/CreateTableModal').then(m => ({ default: m.CreateTableModal }))
);
import { BaseMenu } from '../components/common/BaseMenu';
import { useToast } from '../components/common/Toast';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../hooks/useBaseAccess';
import { formatRelativeDate, extractRelativeTimePart } from '../utils/dateUtils';
import { getRoleLabel } from '../types/roles';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, getUserDisplayName } from '../auth/useCurrentUser';
import { useNavigateToBaseFirstView } from '../hooks/useNavigateToBaseFirstView';
import { getInitials } from '../utils/helpers';
import { Base } from '../types/api.types';

// Wrapper component to handle hooks properly
const BaseMenuWrapper: React.FC<{
  base: any;
  onEdit: (base: any) => void;
  onAddMembers: (base: any) => void;
  onDelete: (base: any) => void;
}> = ({ base, onEdit, onAddMembers, onDelete }) => {
  const { canUpdateBase: canUpdateBaseFromWorkspace, canDeleteBase: canDeleteBaseFromWorkspace, canAssignUsers } = useWorkspaceAccess(base.workspace_id);
  const { canUpdateBase: canUpdateBaseFromBase, canDeleteBase: canDeleteBaseFromBase, canManageBaseMembers, baseAccess } = useBaseAccess(base.id);

  // Base-member can edit title/description, but not delete or manage members
  // Allow edit if: workspace-level permission OR base-level permission OR base-member
  const canEdit = canUpdateBaseFromWorkspace() || canUpdateBaseFromBase() || baseAccess === 'base-member';
  const canDelete = canDeleteBaseFromWorkspace() || canDeleteBaseFromBase();
  const canAddMembers = canAssignUsers() || canManageBaseMembers();
  const hasAnyAction = canEdit || canDelete || canAddMembers;

  // Don't render menu if no actions are available
  if (!hasAnyAction) {
    return null;
  }

  return (
    <div // NOSONAR
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
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

// Helper function to get sort option display label
const getSortOptionLabel = (option: 'recent' | 'a-z' | 'z-a'): string => {
  if (option === 'recent') return 'Recents';
  if (option === 'a-z') return 'A-Z';
  return 'Z-A';
};

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedWorkspaceId, navigateToTable } = useNavigationStore();
  const { data: workspacesData } = useWorkspaces();
  const { data: workspaceBasesData, isLoading: basesLoading } = useWorkspaceBases(selectedWorkspaceId || '');
  const toast = useToast();
  const { canCreateBase, isBaseLevelAccess } = useWorkspaceAccess(selectedWorkspaceId || undefined);
  const createBaseMutation = useCreateBase();
  const createTableMutation = useCreateTable();
    const createBaseWithAiMutation = useCreateBaseWithAi();
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
  const [showCreateBaseWithAi, setShowCreateBaseWithAi] = useState(false);
  const [showImportData, setShowImportData] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<'csv' | 'excel' | 'sql' | 'json' | 'airtable' | 'nocodb' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'recent' | 'a-z' | 'z-a'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [isCreateBaseDropdownOpen, setIsCreateBaseDropdownOpen] = useState(false);
  const createBaseDropdownRef = useRef<HTMLDivElement>(null);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [deletingBase, setDeletingBase] = useState<Base | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [baseForMembers, setBaseForMembers] = useState<Base | null>(null);
  const [showCreateTableBaseId, setShowCreateTableBaseId] = useState<string | null>(null);
  const [checkingBaseId, setCheckingBaseId] = useState<string | null>(null);
  const { data: checkingBaseTablesData } = useBaseTables(checkingBaseId || '');

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createBaseDropdownRef.current &&
        !createBaseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCreateBaseDropdownOpen(false);
      }
    };

    if (isCreateBaseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateBaseDropdownOpen]);

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
    // Set the base to check - this will trigger the useBaseTables hook
    setCheckingBaseId(base.id);
  };

  // Handle table check result - show modal if empty, navigate if has tables
  useEffect(() => {
    if (checkingBaseId && checkingBaseTablesData !== undefined) {
      const tables = Array.isArray(checkingBaseTablesData) ? checkingBaseTablesData : (checkingBaseTablesData as any)?.data || [];

      if (tables.length === 0) {
        // No tables - show toast and open create table modal
        toast.info('This base has no tables yet. Create your first table to get started!');
        setShowCreateTableBaseId(checkingBaseId);
      } else {
        // Has tables - navigate to first view
        navigateToFirstView(checkingBaseId).catch((error: any) => {
          console.error('Failed to navigate to base:', error);
          toast.error(error?.message || 'Failed to navigate to base. Please try again.');
        });
      }

      // Clear the checking state
      setCheckingBaseId(null);
    }
  }, [checkingBaseId, checkingBaseTablesData, navigateToFirstView, toast]);

  const handleEditBase = (base: any) => {
    setEditingBase(base);
  };

  const handleSaveBase = async ({ name, description, image, removeImage }: { name: string; description: string; image?: File | string | null; removeImage?: boolean }) => {
    if (!editingBase) return;

    try {
      const updates: {
        title?: string;
        description?: string;
        image?: File | Blob;
        removeImage?: boolean;
      } = {};

      // Only include fields that have actually changed
      const currentTitle = editingBase.title || editingBase.name || '';
      const currentDescription = editingBase.description || '';

      if (name !== currentTitle) {
        updates.title = name;
      }

      if (description !== currentDescription) {
        updates.description = description;
      }

      // Include image if provided (must be a File object)
      if (image instanceof File) {
        updates.image = image;
      }

      // Include removeImage flag if image was explicitly removed
      if (removeImage) {
        updates.removeImage = true;
      }

      // Check if there are any changes to save
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
  };

  const handleConfirmDelete = async (baseId: string) => {
    try {
      await deleteBaseMutation.mutateAsync(baseId);

      // Use the navigation handler to properly clean up localStorage
      handleBaseDeletion(baseId);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspaceId, 'bases'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['allBases'] });

      toast.success('Base deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete base:', err);
      toast.error(err?.message || 'Failed to delete base. Please try again.');
      throw err; // Re-throw so modal can handle it
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
      await createBaseMutation.mutateAsync({
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
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Failed to create base. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleCreateBaseMenuOpen = () => {
    if (!selectedWorkspaceId || !hasValidSelectedWorkspace) {
      toast.error('Please select a workspace first');
      return;
    }
    setIsCreateBaseDropdownOpen((isOpen) => !isOpen);
  };

  const handleCreateBaseManually = () => {
    if (!selectedWorkspaceId || !hasValidSelectedWorkspace) {
      toast.error('Please select a workspace first');
      return;
    }
    setIsCreateBaseDropdownOpen(false);
    setShowCreateBase(true);
  };

  const handleCreateBaseWithAi = () => {
    if (!selectedWorkspaceId || !hasValidSelectedWorkspace) {
      toast.error('Please select a workspace first');
      return;
    }
    setIsCreateBaseDropdownOpen(false);
    setShowCreateBaseWithAi(true);
  };

  const handleCreateBaseWithAiSubmit = async (prompt: string) => {
    await createBaseWithAiMutation.mutateAsync({ prompt });
    // console.log('AI base creation prompt submitted:', prompt);
    toast.success('AI base generated successfully',);
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
      letter: initials,
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
  const hasValidSelectedWorkspace = Boolean(selectedWorkspaceId && workspacesData?.some((workspace: any) => workspace?.id === selectedWorkspaceId))
  const canUseBaseActions = hasValidSelectedWorkspace && canCreateBase();

  if (basesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
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
      <div className="rounded-2xl relative overflow-visible p-6 md:p-8 lg:p-10 mb-8">
        {/* Rotated Background Image */}
        <div
          className="absolute inset-0 rounded-2xl bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{ backgroundImage: 'url(/assets/home_header_bg.webp)' }}
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
            {/* Create New Base - Only owner, co-owner, maintainer can create */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px] max-w-[300px]" ref={createBaseDropdownRef}>
              <button
                type="button"
                disabled={!canUseBaseActions}
                onClick={handleCreateBaseMenuOpen}
                className={`rounded-xl bg-card border p-5 flex items-start gap-3 transition-all duration-200 w-full text-left ${canUseBaseActions ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'
                  }`}
                aria-expanded={isCreateBaseDropdownOpen}
                aria-haspopup="menu"
              >
                <div className="w-12 h-12 p-3 rounded-xl bg-card border flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-md text-gray-900">Create New Base</div>
                  <div className="text-[10px] text-gray-600">
                    {hasValidSelectedWorkspace ? 'Start from scratch with a custom schema tailored to your team\'s specific requirements.' : 'Select a workspace first.'}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-200 ${isCreateBaseDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCreateBaseDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border rounded-xl shadow-lg z-[9999] overflow-hidden">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleCreateBaseWithAi}
                      className="w-full rounded-xl text-left p-3 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                      role="menuitem"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <span className="font-medium text-primary">Create with AI</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateBaseManually}
                      className="w-full rounded-xl text-left p-3 hover:bg-gray-200 text-sm transition-all duration-200 cursor-pointer"
                      role="menuitem"
                    >
                      <div className="flex items-center gap-3">
                        <Plus className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <span className="font-medium text-primary">Create manually</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Import Data - Only owner, co-owner, maintainer can import */}
            <button
              type="button"
              disabled={!canUseBaseActions}
              onClick={() => {
                if (!selectedWorkspaceId || !hasValidSelectedWorkspace) {
                  toast.error('Please select a workspace first');
                  return;
                }
                setShowImportData(true);
              }}
              className={`rounded-xl bg-card border p-5 flex items-start gap-3 transition-all duration-200 w-full sm:w-auto sm:min-w-[300px] max-w-[300px] text-left ${canUseBaseActions ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'
                }`}
            >
              <div className="w-12 h-12 p-3 rounded-xl bg-card border flex items-center justify-center">
                <Import className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <div className="font-semibold text-md text-gray-900">Import Data</div>
                <div className="text-[10px] text-gray-600">
                  {hasValidSelectedWorkspace ? 'Seamlessly migrate your data from CSV, Excel, JSON or direct Airtable connection.' : 'Select a workspace first.'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* All Bases Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center border-b justify-between gap-4 py-5 mb-5">
        <h2 className="text-2xl font-semibold text-primary">All Bases</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none w-72">
            <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-[var(--color-focus-ring)] focus-within:border-[var(--color-focus-ring)] outline-none transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search bases"
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
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-xl bg-background transition-all duration-200 whitespace-nowrap ${isSortDropdownOpen
                ? 'border-primary ring-1 ring-primary ring-opacity-20'
                : 'border hover:border-gray-400'
                }`}
            >
              <span className="font-medium text-primary">
                {getSortOptionLabel(sortOption)}
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
                        <div className="w-2 h-2 bg-green-500 rounded-full ring ring-green-100 flex-shrink-0"></div>
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
                        <div className="w-2 h-2 bg-green-500 rounded-full ring ring-green-100 flex-shrink-0"></div>
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
                        <div className="w-2 h-2 bg-green-500 rounded-full ring ring-green-100 flex-shrink-0"></div>
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
            const timePart = extractRelativeTimePart(lastModified);

            // Check for base image (same logic as breadcrumb)
            const baseImage = base.image || base.logo || base.meta?.image;
            const baseName = base.title || base.name || 'Base';

            return (
              <div // NOSONAR
                key={base.id}
                onClick={() => handleBaseClick(base)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBaseClick(base);
                  }
                }}
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
                      <h3 className="font-semibold text-base text-gray-900 leading-tight truncate flex-1 min-w-0" title={base.title || base.name}>
                        {base.title || base.name || 'Untitled Base'}
                      </h3>
                      {/* Show badge in place of menu for read-only access, otherwise show menu */}
                      {base.access_level && (base.access_level === 'workspace-read' || base.access_level === 'base-read') ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-lg border flex-shrink-0 text-gray-700">
                          {getRoleLabel(base.access_level)}
                        </span>
                      ) : (
                        <BaseMenuWrapper
                          base={base}
                          onEdit={handleEditBase}
                          onAddMembers={handleAddMembers}
                          onDelete={handleDeleteBase}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1 leading-relaxed" title={base.description}>
                      {base.description || 'Base for general purpose work.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Last Modified */}
                <div
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

      <CreateBaseWithAiModal
        isOpen={showCreateBaseWithAi}
        onClose={() => setShowCreateBaseWithAi(false)}
        onSubmit={handleCreateBaseWithAiSubmit}
      />

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
          initialImage={
            (typeof editingBase.image === 'string' ? editingBase.image : null) ||
            (typeof editingBase.logo === 'string' ? editingBase.logo : null) ||
            (typeof editingBase.meta?.image === 'string' ? editingBase.meta.image : null) ||
            null
          }
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
          }}
          workspaceId={baseForMembers.workspace_id || selectedWorkspaceId || ''}
          baseId={baseForMembers.id}
        />
      )}

      {/* Create Table Modal - Lazy loaded with Suspense */}
      {showCreateTableBaseId && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <Loader />
          </div>
        }>
          <CreateTableModal
            isOpen={!!showCreateTableBaseId}
            onClose={() => setShowCreateTableBaseId(null)}
            baseId={showCreateTableBaseId}
            existingTables={[]}
            onCreate={async ({ name, description }: { name: string; description: string }) => {
              try {
                const newTable = await createTableMutation.mutateAsync({
                  base_id: showCreateTableBaseId,
                  workspace_id: selectedWorkspaceId || '',
                  title: name,
                  description: description || '',
                });

                // Navigate to the newly created table
                if (selectedWorkspaceId && showCreateTableBaseId && newTable && typeof newTable === 'object' && 'data' in newTable && (newTable as any).data?.id) {
                  navigateToTable(selectedWorkspaceId, showCreateTableBaseId, (newTable as any).data.id);
                }

                setShowCreateTableBaseId(null);
                toast.success('Table created successfully');
              } catch (err) {
                console.error('Failed to create table:', err);
                toast.error('Failed to create table. Please try again.');
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default HomePage;
