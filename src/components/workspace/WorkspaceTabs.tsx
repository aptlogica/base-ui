import React from 'react';
import * as LucideIcons from 'lucide-react';
import Tabs from '../common/Tabs';
import { TABS } from '../../config/workspaceConfig';

export interface WorkspaceTabsProps {
  activeKey: string;
  onChange: (key: string) => void;
}

const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({ activeKey, onChange }) => {
  const tabDefs = TABS.map(tab => ({
    key: tab.label,
    label: tab.label,
    icon: (LucideIcons as any)[tab.icon] ? React.createElement((LucideIcons as any)[tab.icon], { size: 18 }) : null,
    count: tab.count
  }));
  return <Tabs tabs={tabDefs} activeKey={activeKey} onChange={onChange} />;
};

export default WorkspaceTabs; 