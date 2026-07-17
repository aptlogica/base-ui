// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, X } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';

interface CreateBaseWithAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<unknown>;
}

export const CreateBaseWithAiModal: React.FC<CreateBaseWithAiModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedButton, setSelectedButton] = useState('Recently Used');
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const suggestedButtons = [
    { label: 'Recently Used'},
    { label: 'Marketing'},
    { label: 'Product Management'},
    { label: 'Project Management'},
    { label: 'Supply Chain Management'},
    { label: 'IT & Operations'},
    { label: 'Finance & Legal'},
    { label: 'HR & Recruiting'},
  ];

    const jobCards = [
    { id: 'asset-management', description: "Create a table to monitor and manage your company's physical assets and equipment with detailed records, locations, ownership, and maintenance information."},
    { id: 'crm', description: "Create a customer relationship management (CRM) table to organize leads, customers, companies, and sales information."},
    { id: 'product-catalog', description: "Build a product catalog table to organize your products or services with names, descriptions, categories, pricing, specifications, and images."},
    { id: 'facilities', description: "Create a facilities management table to keep records of your physical locations, maintenance schedules, resources, and facility details."},
    { id: 'customer-portal', description: "Build a customer portal data table to manage customer profiles, account information, order history, support requests, and contact details."},
    { id: 'inventory', description: "Create an inventory table to track products, stock levels, SKUs, suppliers, storage locations, and reorder thresholds."},
    { id: 'okr', description: "Build an objectives and key results (OKR) table to store goals, key results, owners, deadlines, and progress updates."},
    { id: 'order-management', description: "Create an order management table to record customer orders, invoices, payment status, shipping details, and fulfillment progress."}
  ];

// const marketingCards = [
//   { description: "Create a campaign management table to track marketing campaigns, budgets, channels, and performance metrics."},
//   { description: "Build a lead tracking table to manage leads, sources, scores, and conversion status."},
//   { description: "Create an email marketing table to organize email campaigns, templates, subscribers, and analytics."},
// ];

// const productManagementCards = [
//   { description: "Create a product roadmap table to track features, priorities, release dates, and status."},
//   { description: "Build a user feedback table to collect and organize customer feedback, requests, and votes."},
// ];

// Create a mapping object:
const tabCardsMap: Record<string, Array<{ id: string; description: string }>> = {
  'Recently Used': jobCards,
  // 'Marketing': marketingCards,
  // 'Product Management': productManagementCards,
  // // Add other tabs...
};

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsSubmitting(false);
      setSelectedButton('Recently Used');
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
        className="bg-modal !w-[75rem] !max-w-7xl !p-0 flex flex-col relative overflow-hidden"
        role="none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 icon-primary rounded-full flex items-center justify-center p-3">
              <Sparkles size={20} className="icon-primary" />
            </div>
            <div className="flex flex-col gap-2 flex-1 items-start">
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

        <form id="create-base-with-ai-form" onSubmit={handleSubmit} className="flex-1 max-h-[52vh] overflow-y-auto flex flex-col px-6 items-start self-stretch">
          <div className="py-9 flex flex-col items-start flex-1 self-stretch">
            <div className='flex pb-[1.375rem] flex-col justify-end items-start self-stretch'>
              <MultiLineText
                value={prompt}
                onChange={(value) => {
                  setPrompt(value);
                  if (error) setError('');
                }}
                placeholderElement={<><Sparkles size={16} />Describe the base you want to create...</>}
                rows={6}
                isBorder={true}
                gradientBorder={true}
                required
                className='!rounded-[1.625rem]'
              />
              {/* {error && (
                <div className="text-sm text-red-600">
                  <span>{error}</span>
                </div>
              )} */}
              <div className="flex pt-1 flex-col items-center self-stretch">
                <p className="text-[0.75rem] text-secondary font-normal not-italic text-center">
                  AI can make mistakes. Review important outputs carefully.
                </p>  
              </div>
            </div>
          <div className='flex flex-col items-start gap-[2.125rem] self-stretch'>
            <div className='flex w-[72rem] pb-5 flex-col items-center gap-4'>
              <div className='flex items-center self-stretch'>
                <p className="text-[0.875rem] font-medium text-primary text-center">Suggested Prompts</p>
              </div>
              <div className='flex flex-col items-start gap-[1.125rem] self-stretch'>
                <div className='flex flex-col items-start gap-[0.625rem] self-stretch'>
                  <div className='flex items-start gap-[0.3125rem] self-stretch'>
                    {suggestedButtons.map((button) => (
                      <button type="button" key={button.label} onClick={() => setSelectedButton(button.label)} className={`flex h-9 py-2 px-3 justify-center items-center gap-2 rounded-[0.375rem] border ${
                        selectedButton === button.label 
                          ? 'border-[var(--color-brand-600)] bg-green-50' 
                          : 'border-neutral-200'
                        }`}
                      >
                        <span className={`text-[0.75rem] font-semibold not-italic ${
                          selectedButton === button.label 
                            ? 'text-[var(--color-brand-700)]' 
                            : 'text-neutral-600'
                        }`}>
                          {button.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              <div className="flex justify-between items-start content-start gap-y-[0.875rem] self-stretch flex-wrap">
                {tabCardsMap[selectedButton]?.slice(0, showAllPrompts ? undefined : 8).map((button) => (
                  <div key={button.id} className="flex flex-col items-start rounded-[0.5rem] bg-[var(--color-bg-secondary)] backdrop-blur-sm">
                    <button type="button" onClick={() => setPrompt(button.description)} className="flex px-[0.875rem] pt-[0.625rem] pb-3 flex-col items-start gap-[0.625rem]">
                      <span className='w-[15.5625rem] h-[4.0625rem] text-[var(--color-text-secondary)] text-ellipsis line-clamp-3 text-[0.875rem] not-italic font-normal text-left'>
                        {button.description}
                      </span>
                    </button>
                  </div>
                )) || (
                  <div className="flex items-center justify-center w-full py-12">
                    <span className="text-[var(--color-text-tertiary)] text-lg font-medium">Coming Soon</span>
                  </div>
                )}
              </div>
              </div>
             <div className='flex pt-1 flex-col items-start gap-[0.625rem]'>
              <button 
                type="button" 
                onClick={() => setShowAllPrompts(!showAllPrompts)}
                className="flex items-center justify-center gap-[0.3125rem] rounded-[0.5rem]"
              >
                <span className="text-[0.875rem] font-semibold not-italic text-[var(--color-brand-700)]">
                  {showAllPrompts ? 'See Less Prompts' : 'See More Prompts'}
                </span>
                <ChevronDown size={16} className={`text-[var(--color-brand-700)] transition-transform ${showAllPrompts ? 'rotate-180' : ''}`}/>
              </button>
            </div>
            </div>
          </div>
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
 