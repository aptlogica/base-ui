import React from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeKey, onChange, className }) => {
  return (
    <div className={`flex items-center gap-6 border-b px-7 mt-0 ${className || ''}`}>
      {tabs.map(tab => (
        <div
          key={tab.key}
          className={`
              py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative cursor-pointer
              ${activeKey === tab.key
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span className='text-sm'>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`ml-1.5 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-xs font-medium ${
              activeKey === tab.key 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs; 