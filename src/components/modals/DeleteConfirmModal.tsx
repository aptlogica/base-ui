import React from 'react';
import { Table2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-modal-backdrop relative">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-modal !max-w-md !p-0 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b flex-shrink-0">
          <Table2 size={20} className="text-[var(--color-error-600)] flex-shrink-0" />
          <span className="text-lg font-semibold text-primary truncate">{title}</span>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4">
            <div className="text-[var(--text-color-primary)]">{message}</div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex justify-between gap-2 p-4 border-t flex-shrink-0">
          <button
            type="button"
            className="px-16 py-2 w-full rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-16 py-2 w-full rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 focus:ring-1 focus:ring-red-500 transition-all"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 