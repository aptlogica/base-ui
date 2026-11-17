// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useWorkspaceBases } from '../../hooks/useApi';
import type { Base } from '../../types/api.types';

interface ApplicationBasePickerProps {
  workspaceId: string;
  selected: string[];
  onChange: (baseIds: string[]) => void;
  disabled?: boolean;
}

// The workspace's active bases, from the bases list the rest of the app uses
export const useActiveWorkspaceBases = (workspaceId: string) => {
  const query = useWorkspaceBases(workspaceId);
  const bases = useMemo<Base[]>(() => {
    const data = (query.data as { data?: unknown } | undefined)?.data;
    const list = Array.isArray(data) ? (data as Base[]) : [];
    return list.filter((b) => !b.status || b.status === 'active');
  }, [query.data]);
  return { bases, isLoading: query.isLoading };
};

// Checkboxes for the bases an application exposes; at least one must stay chosen
const ApplicationBasePicker: React.FC<Readonly<ApplicationBasePickerProps>> = ({ workspaceId, selected, onChange, disabled = false }) => {
  const { bases, isLoading } = useActiveWorkspaceBases(workspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading bases…
      </div>
    );
  }
  if (bases.length === 0) {
    return <p className="text-sm text-secondary">This workspace has no bases yet. Create a base first.</p>;
  }

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="sr-only">Bases</legend>
      <div className="max-h-56 overflow-y-auto rounded-xl border divide-y">
        {bases.map((base) => (
          <label key={base.id} className="flex items-center gap-3 px-3 py-2 text-sm text-primary cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              className="h-4 w-4 accent-green-600"
              checked={selected.includes(base.id)}
              onChange={() => toggle(base.id)}
            />
            <span className="truncate">{base.title || 'Untitled Base'}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default ApplicationBasePicker;
