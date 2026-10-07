// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Play } from 'lucide-react';
import { MultiLineText } from '../../common/Fields/MultiLineText';
import { useCreateAutomation, useUpdateAutomation, useRunAutomation } from '../../../hooks/useApi';
import type { Automation } from '../../../service/clientService';
import { AutomationType, TYPE_CONFIG, placeholderFor } from './automationUtils';

interface AutomationFormModalProps {
  type: AutomationType;
  table: any;
  // Set when editing; adds a new entry otherwise
  item?: Automation;
  onClose: () => void;
}

const AutomationFormModal: React.FC<AutomationFormModalProps> = ({ type, table, item, onClose }) => {
  const tableId: string = table?.id;
  const alias: string = table?.alias || 'table_name';
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const [title, setTitle] = useState(item?.title || '');
  const [context, setContext] = useState(item?.context || '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const runAutomation = useRunAutomation();
  const isSaving = createAutomation.isPending || updateAutomation.isPending;

  // Save only stores the changes; Run applies the saved query in Postgres
  const canRun = !!item && type !== 'webhook';
  const hasChanges = !!item && (title.trim() !== (item.title || '') || context.trim() !== item.context.trim());

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ ok: false, text: 'Title is required' });
      return;
    }
    if (!context.trim()) {
      setMessage({ ok: false, text: `${config.queryLabel} is required` });
      return;
    }
    setMessage(null);
    try {
      if (item) {
        await updateAutomation.mutateAsync({ id: item.id, tableId, title: title.trim(), context: context.trim() });
        setMessage({ ok: true, text: canRun ? 'Saved. Click Run to apply it in Postgres.' : 'Saved.' });
        return;
      }
      await createAutomation.mutateAsync({ model_id: tableId, title: title.trim(), type, context: context.trim() });
      onClose();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Failed to save' });
    }
  };

  const handleRun = async () => {
    if (!item) return;
    setMessage(null);
    try {
      await runAutomation.mutateAsync({ id: item.id, tableId });
      onClose();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Failed to run' });
    }
  };

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <div className="bg-modal !p-0 flex flex-col relative overflow-hidden !max-w-2xl !max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">
                {item ? 'Edit' : 'Add'} {config.singular}
              </h2>
              <p className="text-sm text-secondary truncate">
                {table?.title || table?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="automationTitle" className="field-component-label !text-primary">
                Title <span className="field-component-required">*</span>
              </label>
              <input
                id="automationTitle"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={config.titlePlaceholder}
                maxLength={50}
                autoFocus
                className="field-component field-component-border field-component-focus border"
              />
              <p className="text-xs text-gray-500">{title.length}/50 characters</p>
            </div>

            <MultiLineText
              label={config.queryLabel}
              value={context}
              onChange={value => setContext(value)}
              placeholder={placeholderFor(type, alias)}
              rows={12}
              maxLength={5000}
              isBorder={true}
              required
              className="font-mono !text-xs"
              helperText={config.helperText}
            />

            {message && (
              <div className={`text-sm flex items-center gap-1 ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
                {message.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Save stores the changes; Run applies the saved query in Postgres */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          {canRun && (
            <button
              type="button"
              onClick={handleRun}
              disabled={runAutomation.isPending || isSaving || hasChanges}
              title={hasChanges ? 'Save first: Run applies the saved query' : 'Apply the saved query in Postgres'}
              className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {runAutomation.isPending ? 'Running...' : 'Run'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !context.trim() || (!!item && !hasChanges)}
            className="px-10 py-2 rounded-xl btn-primary text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationFormModal;
