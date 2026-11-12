// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Code, KeyRound, LayoutDashboard, LogIn, ScrollText, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import DeveloperOverview from './DeveloperOverview';
import DeveloperLogs from './DeveloperLogs';
import DeveloperApiKeys from './DeveloperApiKeys';
import DeveloperLoginSettings from './DeveloperLoginSettings';
import DeveloperRolesRules from './DeveloperRolesRules';
import { apiDocsPath } from './docs/apiDocsContent';

interface WorkspaceApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sections of the left panel; only Overview is built so far
const SECTIONS: { key: string; label: string; icon: React.ElementType; ready: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, ready: true },
  { key: 'apiKeys', label: 'API keys', icon: KeyRound, ready: true },
  { key: 'loginSettings', label: 'Login settings', icon: LogIn, ready: true },
  { key: 'appUsers', label: 'App users', icon: Users, ready: false },
  { key: 'rolesAndRules', label: 'Roles & rules', icon: ShieldCheck, ready: true },
  { key: 'testAsUser', label: 'Test as user', icon: UserCheck, ready: false },
  { key: 'logs', label: 'Logs', icon: ScrollText, ready: true },
];

// Developer settings of the selected workspace: sections on the left, Overview on the right
export const WorkspaceApiModal: React.FC<WorkspaceApiModalProps> = ({ isOpen, onClose }) => {
  const { selectedWorkspaceId } = useNavigationStore();
  const { currentWorkspace, isAdmin } = useWorkspaceAccess();
  const [activeSection, setActiveSection] = React.useState('overview');

  if (!isOpen) return null;

  const workspaceName: string = currentWorkspace?.title || currentWorkspace?.name || 'this workspace';

  // A new tab keeps the popup open. No noopener: the browser then copies sessionStorage (the login) to the tab.
  const openDocs = () => {
    if (selectedWorkspaceId) window.open(apiDocsPath(selectedWorkspaceId), '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Portal to body: the home banner's z-10 layer would otherwise trap the overlay below the app header
  return createPortal(
    <div // NOSONAR
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.169] backdrop-blur-sm transition-all duration-200 p-4"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div // NOSONAR
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-api-modal-title"
        className="bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl w-[94vw] h-[94vh] flex flex-col relative overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Code className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="workspace-api-modal-title" className="text-xl font-semibold text-primary truncate">
                Developer
              </h2>
              <p className="text-sm text-secondary truncate">
                Let developers build apps on {workspaceName} with APIs, SDKs and app user login.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={openDocs}
              disabled={!selectedWorkspaceId}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="h-4 w-4" />
              API docs
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close"
            >
              <X className="text-gray-500 h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* Left panel: sections */}
          <nav className="w-[220px] flex-shrink-0 border-r bg-gray-50 p-2 space-y-1 overflow-y-auto" aria-label="Developer sections">
            {SECTIONS.map(({ key, label, icon: Icon, ready }) => {
              const isActive = key === activeSection;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!ready}
                  onClick={() => setActiveSection(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors duration-200 ${isActive ? 'bg-card shadow-xs font-medium text-primary' : 'text-gray-700 hover:bg-gray-100'} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent`}
                >
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-green-600" />}
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {!ready && (
                    <span className="badge-gray rounded-full px-1.5 py-0.5 text-[10px] font-medium">Soon</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right panel: the selected section */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {activeSection === 'logs' ? (
              <DeveloperLogs />
            ) : activeSection === 'apiKeys' ? (
              <DeveloperApiKeys />
            ) : activeSection === 'loginSettings' ? (
              <DeveloperLoginSettings />
            ) : activeSection === 'rolesAndRules' ? (
              <DeveloperRolesRules />
            ) : (
              <DeveloperOverview
                workspaceId={selectedWorkspaceId}
                workspaceName={workspaceName}
                canEnable={isAdmin}
                onCancel={onClose}
                onOpenDocs={openDocs}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
