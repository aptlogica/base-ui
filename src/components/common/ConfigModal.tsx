import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ConfigModal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [open]);

  if (!open) return null;
  return (
    <div className="bg-modal-backdrop" onClick={onClose}>
      <div
        className="bg-modal rounded-2xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-8 py-5 border-b border-border bg-header z-10 flex-shrink-0">
          <h2 className="text-2xl font-bold text-primary-brand tracking-tight">Plugin Settings</h2>
          <button
            className="w-9 h-9 p-1 flex items-center justify-center rounded-full hover:bg-background transition-colors duration-200 focus:ring-1 focus:ring-primary"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-6 h-6 text-[var(--text-color-tertiary)]" />
          </button>
        </div>
        <div className="bg-modal-content p-8 space-y-10 divide-y divide-border">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ConfigModal; 