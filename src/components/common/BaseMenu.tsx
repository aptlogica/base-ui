import React from 'react';
import { Edit, Users, Trash2, MoreVertical } from 'lucide-react';
import { PopoverMenu } from './PopoverMenu';
import type { Base } from '../../types/api.types';

interface BaseMenuProps {
  base: Base;
  onEdit: (base: Base) => void;
  onAddMembers: (base: Base) => void;
  onDelete: (base: Base) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddMembers?: boolean;
  align?: 'left' | 'right'
}

export const BaseMenu: React.FC<BaseMenuProps> = ({
  base,
  onEdit,
  onAddMembers,
  onDelete,
  canEdit = true,
  canDelete = true,
  canAddMembers = true,
  align = "right"
}) => {
  const menuItems = [
    ...(canEdit ? [{
      label: 'Edit',
      icon: <Edit className="w-4 h-4 text-gray-500" />,
      onClick: () => onEdit(base),
    }] : []),
    ...(canAddMembers ? [{
      label: 'Add Members',
      icon: <Users className="w-4 h-4 text-gray-500" />,
      onClick: () => onAddMembers(base),
    }] : []),
    ...(canDelete ? [{
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4 text-red-600" />,
      onClick: () => onDelete(base),
      danger: true,
    }] : []),
  ];

  return (
    <PopoverMenu
      align={align}
      portaled={true}
      trigger={<MoreVertical className="w-4 h-4 text-gray-500" />}
      items={menuItems}
    />
  );
};

