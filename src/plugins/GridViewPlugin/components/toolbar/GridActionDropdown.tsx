// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PopoverMenu } from '../../../../components/common/PopoverMenu';
import { GridActionDefinition } from './gridActionCatalog';

interface GridActionDropdownProps {
  label: string;
  icon?: LucideIcon;
  actions: GridActionDefinition[];
  onActionSelect: (action: GridActionDefinition) => void;
}

export const GridActionDropdown: React.FC<GridActionDropdownProps> = ({
  label,
  icon,
  actions,
  onActionSelect,
}) => {
  const TriggerIcon = icon;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <PopoverMenu
      portaled
      align="auto"
      onOpenChange={setIsOpen}
      
      trigger={(
        <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl hover:bg-sidebar-menu focus:outline-none bg-card text-secondary">
          {TriggerIcon ? <TriggerIcon className="w-4 h-4 flex-shrink-0" /> : null}
          <span className='small:hidden overflow-hidden truncate'>{label}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
        </span>
      )}
      items={actions.map((action) => {
        const Icon = action.icon;
        return {
          label: action.label,
          icon: <Icon className="w-5 h-5" />,
          danger: false,
          onClick: () => onActionSelect(action),
        };
      })}
    />
  );
};
