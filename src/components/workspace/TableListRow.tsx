import React from 'react';
import * as LucideIcons from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface TableListRowProps {
  table: {
    name: string;
    icon: string;
    source: string;
    created: string;
    desc?: string;
  };
}

const TableListRow: React.FC<TableListRowProps> = ({ table }) => {
  const Icon = (LucideIcons as any)[table.icon] || LucideIcons.Table2;
  return (
    <div className="grid grid-cols-12 items-center px-6 py-2 border-b border-border hover:bg-main transition">
      <div className="col-span-5 flex items-center gap-2">
        <Icon size={18} />
        <span>{table.name}</span>
      </div>
      <div className="col-span-4 text-secondary">{table.desc || ''}</div>
      <div className="col-span-2 flex items-center gap-1">
        <LucideIcons.BadgeCheck size={16} className="text-primary" />
        <span className="text-xs font-semibold">{table.source}</span>
      </div>
      <div className="col-span-1 text-xs text-secondary">
        {formatDate(table.created)}
      </div>
    </div>
  );
};

export default TableListRow; 