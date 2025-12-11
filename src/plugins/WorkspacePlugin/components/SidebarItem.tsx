import React from 'react';
import * as LucideIcons from 'lucide-react';

interface SidebarItemProps {
  icon: string;
  active: boolean;
  onClick: () => void;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, active, onClick, label }) => {
  const Icon = (LucideIcons as any)[icon] || LucideIcons.Circle;
  return (
    <button
      className={`sidebar-icon-btn${active ? ' sidebar-icon-active' : ' sidebar-icon-inactive'}`}
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

export default SidebarItem; 