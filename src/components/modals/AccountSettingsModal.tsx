import React from 'react';
import { createPortal } from 'react-dom';
import { X, UserPen } from 'lucide-react';
import { AccountSettings } from '../account/AccountSettings';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-card rounded-xl border shadow-xl w-full max-w-5xl h-[90vh] max-h-[900px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            {/* Profile Icon with Pencil */}
            <div className="w-12 h-12 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center">
              <UserPen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Profile Settings</h2>
              <p className="text-sm text-secondary mt-1">Manage your personal profile & security settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* Modal Content - AccountSettings with scrollable body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AccountSettings />
        </div>
      </div>
    </div>,
    document.body
  );
};

