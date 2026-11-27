// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Code, KeyRound, LayoutDashboard, LogIn, Maximize2, Minimize2, ScrollText, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import DeveloperOverview from './DeveloperOverview';
import DeveloperLogs from './DeveloperLogs';
import ApiDocsView from './docs/ApiDocsView';

interface BaseApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseId: string | null;
  baseName?: string;
}

// Sections of the left panel; Overview and Logs are built so far
const SECTIONS: { key: string; label: string; icon: React.ElementType; ready: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, ready: true },
  { key: 'apiKeys', label: 'API keys', icon: KeyRound, ready: false },
  { key: 'loginSettings', label: 'Login settings', icon: LogIn, ready: false },
  { key: 'appUsers', label: 'App users', icon: Users, ready: false },
  { key: 'rolesAndRules', label: 'Roles & rules', icon: ShieldCheck, ready: false },
  { key: 'testAsUser', label: 'Test as user', icon: UserCheck, ready: false },
  { key: 'logs', label: 'Logs', icon: ScrollText, ready: true },
];

// Developer settings of a base: sections on the left, the chosen one on the right
export const BaseApiModal: React.FC<BaseApiModalProps> = ({ isOpen, onClose, baseId, baseName: baseNameProp }) => {
  const { isAdmin } = useWorkspaceAccess();
  // The docs open inside the popup, in place of the sections; Back returns to Overview
  const [showDocs, setShowDocs] = useState(false);
  // The section shown on the right
  const [section, setSection] = useState('overview');
  // Wide by default; the expand button makes the popup fill the whole screen
  const [isFullWidth, setIsFullWidth] = useState(false);

  if (!isOpen) return null;

  const baseName: string = baseNameProp || 'this base';

  const openDocs = () => {
    if (baseId) setShowDocs(true);
  };

  // The popup opens on Overview next time
  const close = () => {
    setShowDocs(false);
    setSection('overview');
    setIsFullWidth(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
  };

  // Portal to body: the card's stacking context would otherwise trap the overlay below the app header
  return createPortal(
    <div // NOSONAR
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/[0.169] backdrop-blur-sm transition-all duration-200 ${isFullWidth ? 'p-0' : 'p-4'}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={close}
      />
      <div // NOSONAR
        role="dialog"
        aria-modal="true"
        aria-labelledby="base-api-modal-title"
        className={`bg-[var(--color-card)] border border-[var(--color-border-primary)] ${isFullWidth ? 'w-screen h-screen max-w-none rounded-none' : 'rounded-xl w-[96vw] max-w-[1500px] h-[94vh]'} shadow-2xl flex flex-col relative overflow-hidden transform transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Code className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="base-api-modal-title" className="text-xl font-semibold text-primary truncate">
                Developer
              </h2>
              <p className="text-sm text-secondary truncate">
                Let developers build apps on {baseName} with APIs, SDKs and app user login.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!showDocs && (
              <button
                type="button"
                onClick={openDocs}
                disabled={!baseId}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BookOpen className="h-4 w-4" />
                API docs
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFullWidth((v) => !v)}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              aria-label={isFullWidth ? 'Exit full width' : 'Full width'}
              title={isFullWidth ? 'Exit full width' : 'Full width'}
            >
              {isFullWidth ? <Minimize2 className="text-gray-500 h-4 w-4" /> : <Maximize2 className="text-gray-500 h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={close}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close"
            >
              <X className="text-gray-500 h-5 w-5" />
            </button>
          </div>
        </div>

        {showDocs ? (
          <div className="flex-1 min-h-0">
            <ApiDocsView
              baseId={baseId}
              onBack={() => setShowDocs(false)}
              backLabel="Back to overview"
              embedded
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            {/* Left panel: sections */}
            <nav className="w-[220px] flex-shrink-0 border-r bg-gray-50 p-2 space-y-1 overflow-y-auto" aria-label="Developer sections">
              {SECTIONS.map(({ key, label, icon: Icon, ready }) => {
                const isActive = key === section;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!ready}
                    onClick={() => setSection(key)}
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

            {/* Right panel: the chosen section */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {section === 'logs' ? (
                <DeveloperLogs baseId={baseId} />
              ) : (
                <DeveloperOverview
                  baseId={baseId}
                  baseName={baseName}
                  canEnable={isAdmin}
                  onCancel={close}
                  onOpenDocs={openDocs}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
