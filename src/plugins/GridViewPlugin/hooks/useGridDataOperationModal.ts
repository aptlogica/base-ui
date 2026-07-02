// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useMemo, useState } from 'react';
import {
  getGridActionById,
  GridActionDefinition,
  GridActionId,
} from '../components/toolbar/gridActionCatalog';

export function useGridDataOperationModal() {
  const [activeActionId, setActiveActionId] = useState<GridActionId | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const activeAction = useMemo<GridActionDefinition | null>(() => {
    if (!activeActionId) return null;
    return getGridActionById(activeActionId);
  }, [activeActionId]);

  const openActionModal = useCallback((action: GridActionDefinition) => {
    setActiveActionId(action.id);
    setIsOpen(true);
  }, []);

  const closeActionModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetActionModal = useCallback(() => {
    setIsOpen(false);
    setActiveActionId(null);
  }, []);

  return {
    activeAction,
    activeActionId,
    isOpen,
    openActionModal,
    closeActionModal,
    resetActionModal,
  };
}
