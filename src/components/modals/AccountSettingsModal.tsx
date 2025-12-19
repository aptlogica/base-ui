import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AccountSettings } from '../account/AccountSettings';
import { useNavigation } from '../../hooks/useNavigation';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedWorkspaceId } = useNavigation();
  const workspaceId = selectedWorkspaceId || 'default';

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
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-primary">Profile Settings</h2>
            <p className="text-sm text-secondary mt-1">Manage your personal profile & security settings</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* Modal Content - AccountSettings */}
        <div className="flex-1 overflow-hidden">
          <AccountSettings workspaceId={workspaceId} />
        </div>
      </div>
    </div>,
    document.body
  );
};

