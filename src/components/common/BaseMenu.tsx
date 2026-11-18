// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Edit, Users, Trash2, MoreVertical, Download, Database, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { PopoverMenu } from './PopoverMenu';
import type { Base } from '../../types/api.types';

export type BaseExportFormat = 'sbase' | 'csv' | 'excel' | 'json';

interface BaseMenuProps {
  base: Base;
  onEdit: (base: Base) => void;
  onAddMembers: (base: Base) => void;
  onDelete: (base: Base) => void;
  onExport?: (base: Base, format: BaseExportFormat) => void;
  canExport?: boolean;
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
  onExport,
  canExport = true,
  canEdit = true,
  canDelete = true,
  canAddMembers = true,
  align = "right"
}) => {
  const menuItems = [
    ...(canEdit ? [{
      label: 'Edit',
      icon: <Edit className="w-5 h-5 text-gray-500" />,
      onClick: () => onEdit(base),
    }] : []),
    ...(canAddMembers ? [{
      label: 'Add Members',
      icon: <Users className="w-5 h-5 text-gray-500" />,
      onClick: () => onAddMembers(base),
    }] : []),
    ...(canExport && onExport ? [{
      label: 'Export',
      icon: <Download className="w-5 h-5 text-gray-500" />,
      onClick: () => undefined,
      children: [
        { label: 'Sereni Base', icon: <Database className="w-4 h-4" />, onClick: () => onExport(base, 'sbase') },
        { label: 'CSV', icon: <FileText className="w-4 h-4" />, onClick: () => onExport(base, 'csv') },
        { label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4" />, onClick: () => onExport(base, 'excel') },
        { label: 'JSON', icon: <FileJson className="w-4 h-4" />, onClick: () => onExport(base, 'json') },
      ],
    }] : []),
    ...(canDelete ? [{
      label: 'Delete',
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
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

