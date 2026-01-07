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
    <div className="bg-modal-backdrop">
      <div className="bg-modal rounded-xl shadow-lg p-6 relative !max-w-md">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <Table2 size={20} className="text-[var(--color-error-600)]" />
          <span className="text-lg font-semibold text-primary">{title}</span>
        </div>
          <div className="bg-modal-content mb-4 text-[var(--text-color-primary)]">{message}</div>
        <div className="flex justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            className="px-16 py-2 w-full rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-16 py-2 w-full rounded-xl bg-red-600 text-white font-semibold"
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