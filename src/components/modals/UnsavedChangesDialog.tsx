// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type UnsavedChangesDialogProps = {
  isOpen: boolean;
  // ✕ or a click outside: keep editing
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

// Asked when a record form is closed with edits that were not saved
const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ isOpen, onCancel, onDiscard, onSave }) => {
  if (!isOpen) return null;

  // Portaled to body so the parent modal's backdrop-blur doesn't trap the fixed mask
  return createPortal(
    <div //NOSONAR
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#0000004d]"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div //NOSONAR
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        className="bg-card rounded-2xl shadow-xl w-full max-w-[400px] p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="unsaved-changes-title" className="text-base font-semibold text-gray-900">Save changes</h3>
          <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={onCancel} aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-700">Do you want to save the changes ?</p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg border bg-card hover:bg-gray-50 text-gray-700"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button type="button" className="px-3 py-1.5 text-sm rounded-lg btn-primary" onClick={onSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UnsavedChangesDialog;
