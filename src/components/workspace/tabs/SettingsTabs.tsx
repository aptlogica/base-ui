import React from 'react';
import * as LucideIcons from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: string;
  upcoming?: boolean;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent size={14} /> : null;
  };

  return (
    <>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative
              ${activeTab === tab.key
                ? 'border-[var(--color-brand-700)] text-[var(--color-brand-700)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {getIconComponent(tab.icon)}
            {tab.label}
            {/* {tab.upcoming && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                Coming Soon
              </span>
            )} */}
          </button>
        ))}
      </nav>
    </>
  );
};
