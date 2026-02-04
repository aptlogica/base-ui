import React, { useState, createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { ProfileSection } from './ProfileSection';
import { SecuritySection } from './SecuritySection';

interface FooterButtonContextType {
  registerFooter: (buttons: React.ReactNode, sectionId: string) => void;
  clearFooter: (sectionId: string) => void;
  currentSection: string;
}

const FooterButtonContext = createContext<FooterButtonContextType | null>(null);

export const useFooterButtons = (): FooterButtonContextType => {
  const context = useContext(FooterButtonContext);
  if (!context) {
    return {
      registerFooter: () => { },
      clearFooter: () => { },
      currentSection: '',
    };
  }
  return context;
};

interface AccountSettingsProps {
  workspaceId?: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [footerButtons, setFooterButtons] = useState<React.ReactNode>(null);
  const [footerSectionOwner, setFooterSectionOwner] = useState<string>('');
  const activeSectionRef = useRef(activeSection);
  const isMountedRef = useRef(true);

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'User' },
    { key: 'security', label: 'Security', icon: 'Shield' },
  ];

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize registerFooter to prevent unnecessary re-renders
  const registerFooter = useCallback((buttons: React.ReactNode, sectionId: string) => {
    // Only update if component is still mounted and sectionId matches current active section
    if (isMountedRef.current && sectionId === activeSectionRef.current) {
      setFooterButtons(buttons);
      setFooterSectionOwner(sectionId);
    }
  }, []);

  // Memoize clearFooter
  const clearFooter = useCallback((sectionId: string) => {
    // Only clear if this section is the owner of the current footer
    if (isMountedRef.current && sectionId === footerSectionOwner) {
      setFooterButtons(null);
      setFooterSectionOwner('');
    }
  }, [footerSectionOwner]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ registerFooter, clearFooter, currentSection: activeSection }),
    [registerFooter, clearFooter, activeSection]
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection key="profile" />;
      case 'security':
        return <SecuritySection key="security" />;
      default:
        return <ProfileSection key="profile-default" />;
    }
  };


 
  return (
    <FooterButtonContext.Provider value={contextValue}>
      <div className="flex flex-col h-full min-h-0">
        {/* Fixed Navigation Tabs */}
        <div className="flex-shrink-0 bg-alpha-white border-b px-6">
          <nav className="flex space-x-8" aria-label="Account sections">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative
                ${activeSection === section.key
                    ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
              `}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-full mx-auto p-6 bg-alpha-white">
            {renderSectionContent()}
          </div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-alpha-white">
          {footerButtons || (
            <div className="flex items-center justify-end gap-3 w-full">
              {/* Default empty footer */}
            </div>
          )}
        </div>
      </div>
    </FooterButtonContext.Provider>
  );
};