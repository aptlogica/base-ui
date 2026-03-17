// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { CreateViewModal } from '../../../../components/modals/CreateViewModal';
import { useTableViews } from '../../../../hooks/useApi';

interface CreateViewModalWrapperProps {
  tableId: string;
  viewType: string;
  fields: any[];
  onClose: () => void;
  onCreate: (data: { name: string; description: string; type: string; fieldId?: string; startDateFieldId?: string; endDateFieldId?: string }) => Promise<void>;
}

/** Wrapper component for CreateViewModal that fetches views on-demand for particular table */
export const CreateViewModalWrapper: React.FC<CreateViewModalWrapperProps> = ({
  tableId,
  viewType,
  fields,
  onClose,
  onCreate
}) => {
  const { data: viewsResponse } = useTableViews(tableId);
  const response = viewsResponse as { data?: unknown[] } | undefined;
  const existingViews = Array.isArray(response?.data) ? response.data : [];

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

