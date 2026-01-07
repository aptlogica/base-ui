import React from 'react';
import { Edit, Users, Trash2, MoreVertical } from 'lucide-react';
import { PopoverMenu } from './PopoverMenu';

interface BaseMenuProps {
  base: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    workspace_id?: string;
  };
  onEdit: (base: any) => void;
  onAddMembers: (base: any) => void;
  onDelete: (base: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddMembers?: boolean;
}

export const BaseMenu: React.FC<BaseMenuProps> = ({
  base,
  onEdit,
  onAddMembers,
  onDelete,
  canEdit = true,
  canDelete = true,
  canAddMembers = true,
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
      align="right"
      portaled={true}
      trigger={<MoreVertical className="w-4 h-4 text-gray-500" />}
      items={menuItems}
    />
  );
};

