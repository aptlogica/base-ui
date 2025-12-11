import React, { useState } from 'react';
import { ProfileSection } from './ProfileSection';
import { SecuritySection } from './SecuritySection';
import { PreferencesSection } from './PreferencesSection';

interface AccountSettingsProps {
  workspaceId: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ workspaceId }) => {
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'User' },
    { key: 'security', label: 'Security', icon: 'Shield' },
    // { key: 'preferences', label: 'Preferences', icon: 'Settings' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySection />;
      case 'preferences':
        return <PreferencesSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Navigation */}
      <div className="flex-shrink-0 bg-alpha-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8" aria-label="Account sections">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`
              py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative
              ${activeSection === section.key
                ? 'border-[var(--color-brand-700)] text-[var(--color-brand-700)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto p-6 bg-alpha-white">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};