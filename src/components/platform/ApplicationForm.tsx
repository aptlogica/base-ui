// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import type { Application } from '../../service/clientService';
import { useCreateApplication } from './useApplications';
import ApplicationBasePicker from './ApplicationBasePicker';

export const MAX_APPLICATION_NAME_LENGTH = 100;

export const INPUT_CLASS =
  'w-full px-3 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] text-sm text-primary focus:outline-none focus:ring-1 focus:ring-green-600';
export const CANCEL_BUTTON_CLASS =
  'px-6 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700';
export const PRIMARY_BUTTON_CLASS =
  'flex items-center gap-2 px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';

// What creating an application does today; keys, app login and rules come in later stages
const CREATE_CHECKLIST = [
  'It gets a permanent API address (app_…) that never changes.',
  'Only the bases you choose are reachable through it; you can change them later.',
  'API keys, app login and access rules are set up in the next steps.',
];

interface ApplicationFormProps {
  workspaceId: string;
  workspaceName: string;
  // Bases chosen when the form opens, e.g. the base whose menu opened it
  initialBaseIds?: string[];
  onCreated: (app: Application) => void;
  onCancel: () => void;
}

// New application: a name, an optional description and the bases it exposes
const ApplicationForm: React.FC<Readonly<ApplicationFormProps>> = ({ workspaceId, workspaceName, initialBaseIds = [], onCreated, onCancel }) => {
  const toast = useToast();
  const create = useCreateApplication(workspaceId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseIds, setBaseIds] = useState<string[]>(initialBaseIds);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && baseIds.length > 0 && !create.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const res = await create.mutateAsync({ name: trimmed, description: description.trim() || undefined, base_ids: baseIds });
      toast.success(`${trimmed} has its API address.`, { title: 'Application created' });
      if (res?.data) onCreated(res.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the application. Please try again.'), { title: 'Create failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-2xl" aria-labelledby="new-application-title">
      <div>
        <h3 id="new-application-title" className="text-lg font-semibold text-primary">New application</h3>
        <p className="mt-1 text-sm text-secondary">
          An application exposes chosen bases of <span className="font-medium text-primary">{workspaceName}</span> to
          your own apps, websites and scripts.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="application-name" className="text-sm font-medium text-primary">Name</label>
        <input
          id="application-name"
          className={INPUT_CLASS}
          value={name}
          maxLength={MAX_APPLICATION_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Customer portal"
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="application-description" className="text-sm font-medium text-primary">
          Description <span className="font-normal text-secondary">(optional)</span>
        </label>
        <textarea
          id="application-description"
          className={INPUT_CLASS}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-primary">Bases</div>
        <p className="text-sm text-secondary">The application can read and write the records of these bases only.</p>
        <ApplicationBasePicker workspaceId={workspaceId} selected={baseIds} onChange={setBaseIds} disabled={create.isPending} />
      </div>

      <ul className="space-y-2">
        {CREATE_CHECKLIST.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-primary">
            <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={create.isPending} className={CANCEL_BUTTON_CLASS}>
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit} className={PRIMARY_BUTTON_CLASS}>
          {create.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Create application
        </button>
      </div>
    </form>
  );
};

export default ApplicationForm;
