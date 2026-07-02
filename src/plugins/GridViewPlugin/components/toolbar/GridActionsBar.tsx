// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Paintbrush, LucideSquaresExclude } from 'lucide-react';
import { GridActionDropdown } from './GridActionDropdown';
import {
  GRID_ACTION_GROUPS,
  GridActionDefinition,
} from './gridActionCatalog';

interface GridActionsBarProps {
  isReadOnly?: boolean;
  onActionSelect: (action: GridActionDefinition) => void;
}

export const GridActionsBar: React.FC<GridActionsBarProps> = ({
  isReadOnly = false,
  onActionSelect,
}) => {
  if (isReadOnly) return null;

  return (
    <div className="flex items-center gap-2">
      <GridActionDropdown
        label="Data Clean"
        icon={Paintbrush}
        actions={GRID_ACTION_GROUPS.clean}
        onActionSelect={onActionSelect}
      />
      <GridActionDropdown
        label="Data Transform"
        icon={LucideSquaresExclude}
        actions={GRID_ACTION_GROUPS.transform}
        onActionSelect={onActionSelect}
      />
    </div>
  );
};
