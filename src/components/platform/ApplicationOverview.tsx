// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { BookOpen, Check, Copy, Database, Loader2, Pencil, Power, Trash2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import { formatDate } from '../../utils/dateUtils';
import { getApiOrigin, type Application } from '../../service/clientService';
import { useDeleteApplication, useSetApplicationBases, useUpdateApplication } from './useApplications';
import LiveDocsLinks, { liveDocsUrls } from './LiveDocsLinks';
import ApplicationBasePicker from './ApplicationBasePicker';
import { CANCEL_BUTTON_CLASS, INPUT_CLASS, MAX_APPLICATION_NAME_LENGTH, PRIMARY_BUTTON_CLASS } from './ApplicationForm';
import { WarningNote } from './docs/ApiDocsBlocks';

const COPY_BUTTON_CLASS = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]';
const SMALL_BUTTON_CLASS = 'flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// A read-only value with a copy button that shows a tick for a moment
export const CopyField: React.FC<Readonly<{ label: string; value: string }>> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-primary">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2">
        <code className="flex-1 min-w-0 font-mono text-sm text-primary truncate">{value}</code>
        <button type="button" onClick={handleCopy} aria-label={`Copy ${label}`} className={COPY_BUTTON_CLASS}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

interface ApplicationOverviewProps {
  workspaceId: string;
  application: Application;
  // Owners and co-owners change applications; other members only see them
  canManage: boolean;
  onOpenDocs?: () => void;
  onDeleted: () => void;
}

// Name and description, edited in place
const DetailsEditor: React.FC<Readonly<{ workspaceId: string; application: Application; onDone: () => void }>> = ({ workspaceId, application, onDone }) => {
  const toast = useToast();
  const update = useUpdateApplication(workspaceId);
  const [name, setName] = useState(application.name);
  const [description, setDescription] = useState(application.description ?? '');
  const trimmed = name.trim();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    try {
      await update.mutateAsync({ id: application.id, input: { name: trimmed, description: description.trim() } });
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the application. Please try again.'), { title: 'Save failed' });
    }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="edit-application-name" className="text-sm font-medium text-primary">Name</label>
        <input id="edit-application-name" className={INPUT_CLASS} value={name} maxLength={MAX_APPLICATION_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="space-y-1">
        <label htmlFor="edit-application-description" className="text-sm font-medium text-primary">Description</label>
        <textarea id="edit-application-description" className={INPUT_CLASS} rows={2} value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} disabled={update.isPending} className={CANCEL_BUTTON_CLASS}>Cancel</button>
        <button type="submit" disabled={!trimmed || update.isPending} className={PRIMARY_BUTTON_CLASS}>
          {update.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Save
        </button>
      </div>
    </form>
  );
};

// The bases the application exposes, and changing them
const BasesSection: React.FC<Readonly<{ workspaceId: string; application: Application; canManage: boolean }>> = ({ workspaceId, application, canManage }) => {
  const toast = useToast();
  const setBases = useSetApplicationBases(workspaceId);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const startEditing = () => {
    setSelected(application.bases.map((b) => b.id));
    setEditing(true);
  };

  const save = async () => {
    try {
      await setBases.mutateAsync({ id: application.id, baseIds: selected });
      toast.success('The application now exposes the chosen bases.', { title: 'Bases saved' });
      setEditing(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the bases. Please try again.'), { title: 'Save failed' });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-primary">Bases</div>
        {canManage && !editing && (
          <button type="button" onClick={startEditing} className={SMALL_BUTTON_CLASS}>
            <Database className="h-4 w-4" />
            Change bases
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <ApplicationBasePicker workspaceId={workspaceId} selected={selected} onChange={setSelected} disabled={setBases.isPending} />
          {selected.length === 0 && <p className="text-xs text-secondary">Choose at least one base.</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(false)} disabled={setBases.isPending} className={CANCEL_BUTTON_CLASS}>Cancel</button>
            <button type="button" onClick={save} disabled={selected.length === 0 || setBases.isPending} className={PRIMARY_BUTTON_CLASS}>
              {setBases.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save bases
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-secondary">Only these bases are reachable through this application's address.</p>
          {application.bases.length === 0 ? (
            <p className="text-sm text-secondary">No active bases: the API answers with an empty list until you add one.</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Bases of this application">
              {application.bases.map((b) => (
                <li key={b.id} className="px-3 py-1 rounded-full border text-sm text-primary bg-gray-50">{b.title}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

// Applications > Overview: the application's address, bases, status and settings
const ApplicationOverview: React.FC<Readonly<ApplicationOverviewProps>> = ({ workspaceId, application, canManage, onOpenDocs, onDeleted }) => {
  const toast = useToast();
  const update = useUpdateApplication(workspaceId);
  const remove = useDeleteApplication(workspaceId);
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const baseUrl = `${getApiOrigin()}${application.base_path}`;

  const toggleEnabled = async () => {
    const enabled = !application.enabled;
    try {
      await update.mutateAsync({ id: application.id, input: { enabled } });
      toast.success(enabled ? 'The application API is on.' : 'The application API is off. Its address is kept.', {
        title: enabled ? 'API turned on' : 'API turned off',
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change the API status. Please try again.'), { title: 'Change failed' });
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(application.id);
      toast.success(`${application.name} was deleted. Its address no longer answers.`, { title: 'Application deleted' });
      onDeleted();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the application. Please try again.'), { title: 'Delete failed' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {editingDetails ? (
        <DetailsEditor workspaceId={workspaceId} application={application} onDone={() => setEditingDetails(false)} />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-primary truncate">{application.name}</h3>
              {application.enabled ? (
                <span className="badge-brand rounded-full px-2 py-0.5 text-xs font-medium">API on</span>
              ) : (
                <span className="badge-gray rounded-full px-2 py-0.5 text-xs font-medium">API off</span>
              )}
            </div>
            {application.description && <p className="mt-1 text-sm text-secondary">{application.description}</p>}
            <p className="mt-1 text-xs text-secondary">
              The address stays the same, even if you rename the application or change its bases.
              {application.enabled && application.enabled_at && ` On since ${formatDate(application.enabled_at)}.`}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={() => setEditingDetails(true)} className={SMALL_BUTTON_CLASS}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button type="button" onClick={toggleEnabled} disabled={update.isPending} className={SMALL_BUTTON_CLASS}>
                {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                {application.enabled ? 'Turn API off' : 'Turn API on'}
              </button>
            </div>
          )}
        </div>
      )}

      <CopyField label="Base URL" value={baseUrl} />
      <CopyField label="Application API ID" value={application.public_id} />
      <CopyField label="Try it: list this application's bases" value={`curl ${baseUrl}/bases`} />

      <BasesSection workspaceId={workspaceId} application={application} canManage={canManage} />

      <div className="space-y-2">
        <div className="text-sm font-medium text-primary">Live docs for your tables</div>
        {application.enabled ? (
          <>
            <p className="text-sm text-secondary">
              Built from the real tables and fields of this application's bases, and updated within seconds when they change.
            </p>
            <LiveDocsLinks baseUrl={baseUrl} />
          </>
        ) : (
          <p className="text-sm text-secondary">Turn the API on to open the live docs.</p>
        )}
      </div>
      <CopyField label="OpenAPI spec (for Postman or code generators)" value={liveDocsUrls(baseUrl).spec} />
      {onOpenDocs && (
        <button type="button" onClick={onOpenDocs} className="flex items-center gap-2 text-sm font-medium text-green-700 hover:underline">
          <BookOpen className="w-4 h-4" />
          Read the API docs: every endpoint with request and response examples
        </button>
      )}
      <WarningNote>
        Development only: there are no API keys yet, so anyone with this URL can read and change the data of this
        application's bases. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true.
      </WarningNote>

      {canManage && (
        <div className="rounded-xl border border-red-200 p-4 space-y-3">
          <div>
            <div className="text-sm font-medium text-primary">Delete application</div>
            <p className="text-sm text-secondary">
              Its address stops working at once and is never reused. The bases and their records are not touched.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-primary mr-auto">Delete {application.name}?</span>
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={remove.isPending} className={CANCEL_BUTTON_CLASS}>Cancel</button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={remove.isPending}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all disabled:opacity-50"
              >
                {remove.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Delete
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={`${SMALL_BUTTON_CLASS} text-red-700`}>
              <Trash2 className="h-4 w-4" />
              Delete application
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationOverview;
