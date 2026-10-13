// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Play, ShieldCheck } from 'lucide-react';
import { MultiLineText } from '../../common/Fields/MultiLineText';
import { useCreateAutomation, useUpdateAutomation, useRunAutomation, useValidateAutomation } from '../../../hooks/useApi';
import type { Automation } from '../../../service/clientService';
import {
  AutomationType, TRIGGER_OPERATIONS, TRIGGER_TIMINGS, TYPE_CONFIG, TriggerOperation, TriggerTiming,
  formatEvent, parseEvent, parseQueryEvent, placeholderFor, withTriggerEvents,
} from './automationUtils';

interface AutomationFormModalProps {
  type: AutomationType;
  table: any;
  // Set when editing; adds a new entry otherwise
  item?: Automation;
  onClose: () => void;
}

const DEFAULT_EVENT = { timing: 'AFTER' as TriggerTiming, operations: ['INSERT'] as TriggerOperation[] };

// Timing and events to start with: the stored event, else the ones written in the saved query
const initialEventOf = (item?: Automation) =>
  parseEvent(item?.event) || (item && parseQueryEvent(item.context)) || DEFAULT_EVENT;

// The first reason the form can't be saved yet, or null
const formError = (title: string, context: string, isTrigger: boolean, operations: TriggerOperation[], queryLabel: string): string | null => {
  if (!title.trim()) return 'Title is required';
  if (isTrigger && operations.length === 0) return 'Select at least one event';
  if (!context.trim()) return `${queryLabel} is required`;
  return null;
};

// Whether the title, query or (for a trigger) event differ from the saved entry
const differsFromSaved = (item: Automation, title: string, context: string, isTrigger: boolean, event: string): boolean =>
  title.trim() !== (item.title || '') || context.trim() !== item.context.trim() || (isTrigger && event !== (item.event || ''));

const errorText = (err: any, fallback: string): string => err?.message || fallback;

const AutomationFormModal: React.FC<AutomationFormModalProps> = ({ type, table, item, onClose }) => {
  const tableId: string = table?.id;
  const alias: string = table?.alias || 'table_name';
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const [title, setTitle] = useState(item?.title || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState(item?.context || '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Timing and events of a trigger: stored in the event column and written into the query
  const isTrigger = type === 'trigger';
  const initialEvent = initialEventOf(item);
  const [timing, setTiming] = useState<TriggerTiming>(initialEvent.timing);
  const [operations, setOperations] = useState<TriggerOperation[]>(initialEvent.operations);
  const event = isTrigger ? formatEvent(timing, operations) : '';

  const changeEvent = (nextTiming: TriggerTiming, nextOperations: TriggerOperation[]) => {
    setTiming(nextTiming);
    setOperations(nextOperations);
    // With no event ticked the query keeps its events; Save asks for at least one
    if (nextOperations.length > 0) {
      setContext(prev => withTriggerEvents(prev, nextTiming, nextOperations));
    }
  };

  const toggleOperation = (op: TriggerOperation) =>
    changeEvent(timing, operations.includes(op) ? operations.filter(o => o !== op) : [...operations, op]);

  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const runAutomation = useRunAutomation();
  const validateAutomation = useValidateAutomation();
  const isSaving = createAutomation.isPending || updateAutomation.isPending;

  // Save only stores the changes; Run applies the saved query in Postgres
  const canRun = !!item && type !== 'webhook';
  // Validate checks the query as typed, saved or not, so it is offered for new entries too
  const canValidate = type !== 'webhook';
  // The query as it will be sent: the chosen timing and events win over what is typed
  const preparedQuery = () => (isTrigger ? withTriggerEvents(context, timing, operations) : context).trim();
  // Query and events that last passed Validate; Run shows only while the form still matches them
  const [validated, setValidated] = useState<string | null>(null);
  const isValidated = validated !== null && validated === `${preparedQuery()}\n${event}`;
  const hasChanges = !!item && differsFromSaved(item, title, context, isTrigger, event);

  const handleSave = async () => {
    const invalid = formError(title, context, isTrigger, operations, config.queryLabel);
    if (invalid) {
      setMessage({ ok: false, text: invalid });
      return;
    }
    // The chosen timing and events win over what is typed in the query
    const query = (isTrigger ? withTriggerEvents(context, timing, operations) : context).trim();
    setContext(query);
    setMessage(null);
    try {
      if (item) {
        await updateAutomation.mutateAsync({ id: item.id, tableId, title: title.trim(), context: query, event });
        setMessage({ ok: true, text: canRun ? 'Saved. Click Run to apply it in Postgres.' : 'Saved.' });
        return;
      }
      await createAutomation.mutateAsync({ model_id: tableId, title: title.trim(), type, context: query, event });
      onClose();
    } catch (err: any) {
      setMessage({ ok: false, text: errorText(err, 'Failed to save') });
    }
  };

  // Postgres runs the query in a transaction that is rolled back, so nothing is changed
  const handleValidate = async () => {
    if (type === 'webhook') return;
    const query = preparedQuery();
    setMessage(null);
    setValidated(null);
    try {
      const result = await validateAutomation.mutateAsync({ model_id: tableId, id: item?.id, type, context: query, event });
      if (result.data.valid) {
        setValidated(`${query}\n${event}`);
        setMessage({ ok: true, text: canRun ? 'Valid: Postgres accepts this query. You can run it now.' : 'Valid: Postgres accepts this query.' });
      } else {
        setMessage({ ok: false, text: result.data.message || 'Postgres rejected this query' });
      }
    } catch (err: any) {
      setMessage({ ok: false, text: errorText(err, 'Failed to validate') });
    }
  };

  const handleRun = async () => {
    if (!item) return;
    setMessage(null);
    try {
      await runAutomation.mutateAsync({ id: item.id, tableId });
      onClose();
    } catch (err: any) {
      setMessage({ ok: false, text: errorText(err, 'Failed to run') });
    }
  };

  // Focus the title when the form opens
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

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
                ref={titleInputRef}
                className="field-component field-component-border field-component-focus border"
              />
              <p className="text-xs text-gray-500">{title.length}/50 characters</p>
            </div>

            {isTrigger && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="field-component-label !text-primary">Trigger timing <span className="field-component-required">*</span></p>
                  <fieldset className="flex items-center border border-[var(--color-border-primary)] rounded-xl p-0.5 w-fit" aria-label="Trigger timing">
                    {TRIGGER_TIMINGS.map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => changeEvent(value, operations)}
                        aria-pressed={timing === value}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${timing === value ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-bg)] hover:text-[var(--color-text-primary)]'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </fieldset>
                </div>
                <div className="space-y-1">
                  <p className="field-component-label !text-primary">Trigger events <span className="field-component-required">*</span></p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {TRIGGER_OPERATIONS.map(op => (
                      <label key={op} className="flex items-center gap-2 text-sm text-primary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={operations.includes(op)}
                          onChange={() => toggleOperation(op)}
                          className="w-4 h-4 accent-[var(--color-bg-brand-primary)]"
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Saved as: {event || '-'}.{' '}
                    {timing === 'INSTEAD OF' && 'INSTEAD OF works only on views, not tables. '}
                    {operations.includes('TRUNCATE') && 'TRUNCATE needs FOR EACH STATEMENT instead of FOR EACH ROW.'}
                  </p>
                </div>
              </div>
            )}

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

        {/* Footer: Validate checks the query as typed; Save stores the changes; Run applies the saved query in Postgres */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          {/* Validate until the query passes, then Run in its place */}
          {canValidate && !(canRun && isValidated) && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={validateAutomation.isPending || runAutomation.isPending || isSaving || !context.trim() || (isTrigger && operations.length === 0)}
              title="Check the query in Postgres without changing anything"
              className="px-6 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {validateAutomation.isPending ? 'Validating...' : 'Validate'}
            </button>
          )}
          {canRun && isValidated && (
            <button
              type="button"
              onClick={handleRun}
              disabled={runAutomation.isPending || validateAutomation.isPending || isSaving || hasChanges}
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
            // A trigger or function is saved only once the query as typed has passed Validate
            disabled={isSaving || !title.trim() || !context.trim() || (isTrigger && operations.length === 0) || (!!item && !hasChanges) || (canValidate && !isValidated)}
            title={canValidate && !isValidated ? 'Validate the query first' : undefined}
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
