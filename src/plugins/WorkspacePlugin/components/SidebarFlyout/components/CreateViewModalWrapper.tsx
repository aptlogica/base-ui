import React from 'react';
import { CreateViewModal } from '../../../../../components/modals/CreateViewModal';
import { useTableViews } from '../../../../../hooks/useApi';

interface CreateViewModalWrapperProps {
  tableId: string;
  viewType: string;
  fields: any[];
  onClose: () => void;
  onCreate: (data: { name: string; description: string; type: string; fieldId?: string; startDateFieldId?: string; endDateFieldId?: string }) => Promise<void>;
}

/**
 * Wrapper component for CreateViewModal that fetches views on-demand
 * This prevents fetching views for all tables upfront
 */
export const CreateViewModalWrapper: React.FC<CreateViewModalWrapperProps> = ({
  tableId,
  viewType,
  fields,
  onClose,
  onCreate
}) => {
  // Fetch views only for this specific table when modal opens
  // This is needed for validation (checking duplicate view names)
  const { data: viewsResponse } = useTableViews(tableId);
  const existingViews = viewsResponse?.data || [];

  return (
    <CreateViewModal
      isOpen={true}
      onClose={onClose}
      tableId={tableId}
      viewType={viewType}
      defaultName={`${viewType.charAt(0).toUpperCase() + viewType.slice(1)} View`}
      fields={fields}
      existingViews={existingViews}
      onCreate={onCreate}
    />
  );
};

