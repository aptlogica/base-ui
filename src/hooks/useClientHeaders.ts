// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useEffect } from 'react';
import { useNavigationStore } from '../stores/navigationStore';
import { updateClientWorkspaceAndBase } from '../service/clientService';

/**
 * Hook to automatically update client headers when workspace/base changes
 * Sets workspace header when workspace is selected
 * Sets base header when base is selected
 */
export const useClientHeaders = () => {
  const selectedWorkspaceId = useNavigationStore((state) => state.selectedWorkspaceId);
  const selectedBaseId = useNavigationStore((state) => state.selectedBaseId);

  useEffect(() => {
    // Update client headers whenever workspace or base changes
    updateClientWorkspaceAndBase(selectedWorkspaceId, selectedBaseId);
  }, [selectedWorkspaceId, selectedBaseId]);
};

