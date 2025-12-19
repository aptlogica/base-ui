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
    <div className="bg-modal-backdrop">
      <div className="bg-modal rounded-xl shadow-lg p-6 w-full !max-w-md relative">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <TriangleAlert size={20} color="var(--color-warning-400)" />
          <span className="text-lg font-semibold text-[var(--text-color-tertiary-heading)]">{title}</span>
        </div>
        <div className="bg-modal-content mb-4 text-[var(--text-color-tertiary)]">{message}</div>
        <div className="flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded btn-primary text-white font-semibold"
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