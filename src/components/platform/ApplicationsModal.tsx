// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppWindow, BookOpen, KeyRound, LayoutDashboard, Loader2, LogIn, Plus, ScrollText, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { apiErrorMessage } from '../../utils/apiErrors';
import { useApplications } from './useApplications';
import ApplicationOverview from './ApplicationOverview';
import ApplicationForm, { PRIMARY_BUTTON_CLASS } from './ApplicationForm';
import ApiDocsView from './docs/ApiDocsView';

interface ApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Opened from a base's menu: shows an application that uses this base, or a new one with it chosen
  focusBaseId?: string;
  // The workspace of that base; defaults to the selected workspace
  workspaceId?: string;
}

// Sections of an application; only Overview is built so far
const SECTIONS: { key: string; label: string; icon: React.ElementType; ready: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, ready: true },
  { key: 'apiKeys', label: 'API keys', icon: KeyRound, ready: false },
  { key: 'loginSettings', label: 'Login settings', icon: LogIn, ready: false },
  { key: 'appUsers', label: 'App users', icon: Users, ready: false },
  { key: 'rolesAndRules', label: 'Roles & rules', icon: ShieldCheck, ready: false },
  { key: 'testAsUser', label: 'Test as user', icon: UserCheck, ready: false },
  { key: 'logs', label: 'Logs', icon: ScrollText, ready: false },
];

const HEADER_BUTTON_CLASS = 'flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

// The workspace's applications: the list on the left, the chosen one (or a new one) on the right
export const ApplicationsModal: React.FC<Readonly<ApplicationsModalProps>> = ({ isOpen, onClose, focusBaseId, workspaceId: workspaceIdProp }) => {
  const { selectedWorkspaceId } = useNavigationStore();
  const workspaceId = workspaceIdProp || selectedWorkspaceId || '';
  const { currentWorkspace, isAdmin } = useWorkspaceAccess(workspaceId || undefined);
  const { data: applications = [], isLoading, error, refetch } = useApplications(isOpen ? workspaceId : null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createBaseIds, setCreateBaseIds] = useState<string[]>([]);
  // The docs open inside the popup, in place of the application; Back returns to it
  const [showDocs, setShowDocs] = useState(false);
  const [focusHandled, setFocusHandled] = useState(false);

  // Opened from a base: its first application, or a new one with the base chosen
  useEffect(() => {
    if (!isOpen || isLoading || focusHandled) return;
    if (focusBaseId) {
      const using = applications.find((app) => app.bases.some((b) => b.id === focusBaseId));
      if (using) {
        setSelectedId(using.id);
        setCreating(false);
      } else if (isAdmin) {
        setCreateBaseIds([focusBaseId]);
        setCreating(true);
      }
    }
    setFocusHandled(true);
  }, [isOpen, isLoading, focusHandled, focusBaseId, applications, isAdmin]);

  if (!isOpen) return null;

  const workspaceName: string = currentWorkspace?.title || currentWorkspace?.name || 'this workspace';
  // A selected application that was deleted elsewhere falls back to the first one
  const selected = applications.find((app) => app.id === selectedId) ?? (creating ? undefined : applications[0]);

  const close = () => {
    setShowDocs(false);
    setCreating(false);
    setSelectedId(null);
    setFocusHandled(false);
    onClose();
  };

  const startCreating = () => {
    setCreateBaseIds([]);
    setCreating(true);
    setShowDocs(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  const rightPanel = (): React.ReactNode => {
    if (creating && isAdmin) {
      return (
        <ApplicationForm
          // A new key resets the form when it is opened again for another base
          key={createBaseIds.join(',')}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          initialBaseIds={createBaseIds}
          onCreated={(app) => {
            setCreating(false);
            setSelectedId(app.id);
          }}
          onCancel={() => setCreating(false)}
        />
      );
    }
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-6">
          <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between gap-3">
            <span>{apiErrorMessage(error, 'Could not load the applications of this workspace.')}</span>
            <button type="button" onClick={() => void refetch()} className="font-medium underline">Retry</button>
          </div>
        </div>
      );
    }
    if (!selected) {
      return (
        <div className="h-full p-6">
          <div className="h-full rounded-xl bg-gray-50 border flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-3">
              <AppWindow className="w-10 h-10 mx-auto text-gray-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-primary">No applications yet</h3>
              <p className="text-sm text-secondary">
                An application gives your own apps, websites and scripts an API address for the bases you choose.
              </p>
              {isAdmin ? (
                <button type="button" onClick={startCreating} className={`${PRIMARY_BUTTON_CLASS} mx-auto`}>
                  <Plus className="w-4 h-4" />
                  New application
                </button>
              ) : (
                <p className="text-sm text-secondary">Only workspace owners and co-owners can create applications.</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <nav className="flex items-center gap-1 px-4 pt-3 border-b overflow-x-auto" aria-label="Application sections">
          {SECTIONS.map(({ key, label, icon: Icon, ready }) => {
            const isActive = key === 'overview';
            return (
              <button
                key={key}
                type="button"
                disabled={!ready}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${isActive ? 'border-green-600 font-medium text-primary' : 'border-transparent text-gray-600'} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
                {!ready && <span className="badge-gray rounded-full px-1.5 py-0.5 text-[10px] font-medium">Soon</span>}
              </button>
            );
          })}
        </nav>
        <ApplicationOverview
          workspaceId={workspaceId}
          application={selected}
          canManage={isAdmin}
          onOpenDocs={() => setShowDocs(true)}
          onDeleted={() => setSelectedId(null)}
        />
      </>
    );
  };

  // Portal to body: the home banner's z-10 layer would otherwise trap the overlay below the app header
  return createPortal(
    <div // NOSONAR
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.169] backdrop-blur-sm transition-all duration-200 p-4"
      onKeyDown={handleKeyDown}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={close} />
      <div // NOSONAR
        role="dialog"
        aria-modal="true"
        aria-labelledby="applications-modal-title"
        className="bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl w-[94vw] max-w-6xl h-[94vh] flex flex-col relative overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <AppWindow className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="applications-modal-title" className="text-xl font-semibold text-primary truncate">Applications</h2>
              <p className="text-sm text-secondary truncate">
                Give your own apps, websites and scripts an API to chosen bases of {workspaceName}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!showDocs && (
              <button type="button" onClick={() => setShowDocs(true)} disabled={!workspaceId} className={HEADER_BUTTON_CLASS}>
                <BookOpen className="h-4 w-4" />
                API docs
              </button>
            )}
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
              workspaceId={workspaceId}
              applicationId={creating ? undefined : selected?.id}
              onBack={() => setShowDocs(false)}
              backLabel="Back to applications"
              embedded
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            {/* Left panel: the applications */}
            <nav className="w-[240px] flex-shrink-0 border-r bg-gray-50 p-2 space-y-1 overflow-y-auto" aria-label="Applications">
              {isAdmin && (
                <button
                  type="button"
                  onClick={startCreating}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-green-700 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                  New application
                </button>
              )}
              {applications.map((app) => {
                const isActive = !creating && selected?.id === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(app.id);
                      setCreating(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative w-full flex flex-col items-start px-3 py-2 rounded-xl text-left transition-colors duration-200 ${isActive ? 'bg-card shadow-xs' : 'hover:bg-gray-100'}`}
                  >
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-green-600" />}
                    <span className="w-full flex items-center gap-2">
                      <span className={`flex-1 truncate text-sm ${isActive ? 'font-medium text-primary' : 'text-gray-700'}`}>{app.name}</span>
                      {!app.enabled && <span className="badge-gray rounded-full px-1.5 py-0.5 text-[10px] font-medium">Off</span>}
                    </span>
                    <span className="text-[11px] text-secondary truncate w-full">
                      {app.bases.length === 1 ? app.bases[0].title : `${app.bases.length} bases`} · {app.public_id}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Right panel */}
            <div className="flex-1 min-w-0 overflow-y-auto">{rightPanel()}</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
