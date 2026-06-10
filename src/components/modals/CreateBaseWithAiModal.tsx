// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';

interface CreateBaseWithAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<unknown> | unknown;
}

export const CreateBaseWithAiModal: React.FC<CreateBaseWithAiModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (event?: React.SyntheticEvent) => {
    event?.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError('Prompt is required');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await Promise.resolve(onSubmit(trimmedPrompt));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create base with AI. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="bg-modal-backdrop relative"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="bg-modal !max-w-3xl !p-0 flex flex-col relative overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="icon-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Create Base with AI</h2>
              <p className="text-sm text-secondary truncate">Describe the base you want to generate</p>
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

        <form id="create-base-with-ai-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            <MultiLineText
              label="Prompt"
              value={prompt}
              onChange={(value) => {
                setPrompt(value);
                if (error) setError('');
              }}
              placeholder="Example: Create a CRM base for tracking leads, contacts, deals, follow-ups, and sales pipeline stages."
              rows={8}
              isBorder={true}
              required
            />
            {error && (
              <div className="text-sm text-red-600">
                <span>{error}</span>
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              handleSubmit(event);
            }}
            disabled={isSubmitting || !prompt.trim()}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              'Generate Base'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
 