import React from 'react';
import { TriangleAlert } from 'lucide-react';

interface UpdateFieldConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

const UpdateFieldConfirmModal: React.FC<UpdateFieldConfirmModalProps> = ({ isOpen, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-modal-backdrop relative">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-modal w-full !max-w-md !p-0 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b flex-shrink-0">
          <TriangleAlert size={20} color="var(--color-warning-400)" className="flex-shrink-0" />
          <span className="text-lg font-semibold text-[var(--text-color-tertiary-heading)] truncate">{title}</span>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4">
            <div className="font-bold text-[var(--text-color-tertiary)]">{message}</div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex justify-between gap-2 p-4 border-t flex-shrink-0">
          <button
            type="button"
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-16 py-2 rounded-xl btn-primary text-white font-semibold hover:opacity-90 focus:ring-1 focus:ring-primary transition-all"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateFieldConfirmModal;