import React, { useState } from 'react';
import { MAIN_CARDS } from '../../config/workspaceConfig';
import { CreateTableModal } from '../modals/CreateTableModal';
import { ImportDataModal } from '../modals/ImportDataModal';
import { ImportModal } from '../modals/ImportModal';
import { useNavigate, useParams } from 'react-router-dom';
// removed default field creation dependency
import useWorkspaceData from '../../hooks/useWorkspaceData';
import * as LucideIcons from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';

interface MainCardGridProps {
  baseId?: string | null;
  workspaceId?: string | null;
}

const MainCardGrid: React.FC<MainCardGridProps> = ({ baseId, workspaceId }) => {
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showImportData, setShowImportData] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<'csv' | 'excel' | 'sql' | 'json' | 'airtable' | 'nocodb' | null>(null);
  const [tableError, setTableError] = useState('');
  const navigate = useNavigate();
  const params = useParams();
  const { selectedWorkspaceId: storeWorkspaceId } = useNavigationStore();
  const resolvedBaseId = baseId || params.baseId;
  const resolvedWorkspaceId = workspaceId || params.workspaceId || storeWorkspaceId || undefined;

  // TanStack Query mutation
  const { createTableMutation, _raw } = useWorkspaceData(resolvedWorkspaceId, resolvedBaseId || undefined);
  const { navigateAndPersist } = useNavigationStore();
  const { navigateToTable } = useNavigation();
  const { user } = useAuth();
  const toast = useToast();
  const { canCreateTable } = useWorkspaceAccess(resolvedWorkspaceId || undefined);

  const handleCreateTable = async ({ name, description }: { name: string; description: string }) => {
    if (!resolvedBaseId) {
      setTableError('Base ID not found');
      return;
    }
    if (!resolvedWorkspaceId) {
      setTableError('Workspace ID not found');
      return;
    }
    try {
      setTableError('');
  // Determine order_index based on number of existing tables in the base
  const existingTables = _raw?.baseTablesQuery?.data || [];
  const order_index = Array.isArray(existingTables) ? existingTables.length : 0;
      const newTable = await createTableMutation.mutateAsync({
        base_id: resolvedBaseId,
        workspace_id: resolvedWorkspaceId,
        title: name,
        description: description || '',
        order_index,
      });

      // NOTE: Default field creation has been removed. Users can add fields from table settings.

      // Update navigation store and persist user navigation
      // Persist navigation and optionally navigate only if we have a valid new table id
      const newTableId = (newTable as any)?.data?.id || (newTable as any)?.id || (newTable as any)?.data?.data?.id;
      try {
        if (resolvedWorkspaceId && newTableId) {
          navigateAndPersist(resolvedWorkspaceId, resolvedBaseId as string, newTableId, user?.id);
          // Prefer staying on the list; remove navigation to avoid undefined route while views hydrate
          // If you want to navigate, uncomment the next line
          // navigateToTable(resolvedWorkspaceId, resolvedBaseId as string, newTableId);
        }
      } catch (navErr) {
        // non-fatal
      }

      setShowCreateTable(false);
      // TanStack Query automatically handles cache invalidation
    } catch (err) {
      setTableError('Failed to create table');
      if (toast) {
        toast.error('Failed to create table');
      }
    }
  };

  // Map card icons to Lucide icons
  const getCardIcon = (iconName: string) => {
    const iconProps = { size: 20, className: 'text-gray-700' };
    switch (iconName) {
      case 'Plus':
        return <LucideIcons.Plus {...iconProps} />;
      case 'Download':
        return <LucideIcons.Download {...iconProps} />;
      case 'Server':
        return <LucideIcons.Server {...iconProps} />;
      case 'FileCode':
        return <LucideIcons.FileCode {...iconProps} />;
      case 'FileText':
        return <LucideIcons.FileText {...iconProps} />;
      case 'LayoutDashboard':
        return <LucideIcons.LayoutDashboard {...iconProps} />;
      default:
        return <LucideIcons.Plus {...iconProps} />;
    }
  };

  // Get icon color based on card type
  const getIconColor = (iconName: string) => {
    switch (iconName) {
      case 'Plus':
      case 'FileCode':
      case 'LayoutDashboard':
        return 'text-blue-600';
      case 'Download':
        return 'text-orange-600';
      case 'Server':
        return 'text-green-600';
      case 'FileText':
        return 'text-red-700';
      default:
        return 'text-gray-800';
    }
  };

  const handleImportTypeSelect = (importType: string) => {
    // Only CSV is currently supported
    if (importType === 'csv') {
      setSelectedImportType('csv');
      setShowImportModal(true);
    } else {
      if (toast) {
        toast.info(`${importType.toUpperCase()} import will be available soon`);
      }
    }
  };

  const handleImportSuccess = () => {
    // Refresh tables list
    if (_raw?.baseTablesQuery?.refetch) {
      _raw.baseTablesQuery.refetch();
    }
    setShowImportModal(false);
    setSelectedImportType(null);
  };

  // Filter cards based on access level - hide "Create Table" for limited_access users
  const filteredCards = MAIN_CARDS.filter(card => {
    if (card.action === 'Create Table') {
      return canCreateTable();
    }
    return true; // Show all other cards
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {filteredCards.map(card => (
        <div
          key={card.title}
          className="rounded-lg shadow-sm bg-card border px-6 py-5 flex flex-col items-start cursor-pointer hover:shadow-md transition-all duration-200"
          onClick={() => {
            if (card.action === 'Create Table') setShowCreateTable(true);
            if (card.action === 'Import') setShowImportData(true);
          }}
        >
          <div className={`w-10 h-10 rounded-full p-2 bg-gray-100 flex items-center justify-center mb-4 ${getIconColor(card.icon || 'Plus')}`}>
            {getCardIcon(card.icon || 'Plus')}
          </div>
          <div className="font-semibold text-base text-gray-900 mb-1">{card.title}</div>
          <div className="text-gray-600 text-sm leading-relaxed">{card.desc}</div>
        </div>
      ))}
      <CreateTableModal
        isOpen={showCreateTable}
        onClose={() => setShowCreateTable(false)}
        onCreate={handleCreateTable}
        baseId={resolvedBaseId || ''}
        existingTables={_raw?.baseTablesQuery?.data || []}
      />
      <ImportDataModal
        isOpen={showImportData}
        onClose={() => setShowImportData(false)}
        onSelectImportType={handleImportTypeSelect}
      />
      {selectedImportType && resolvedBaseId && resolvedWorkspaceId && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setSelectedImportType(null);
          }}
          onSuccess={handleImportSuccess}
          importType={selectedImportType}
          baseId={resolvedBaseId}
          workspaceId={resolvedWorkspaceId}
          existingTables={_raw?.baseTablesQuery?.data || []}
        />
      )}
    </div>
  );
};

export default MainCardGrid; 