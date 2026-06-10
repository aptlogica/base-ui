// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';

interface CreateTableWithAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<unknown> | unknown;
}

export const CreateTableWithAiModal: React.FC<CreateTableWithAiModalProps> = ({
  onClose,
  isOpen,
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
   const [showTable1, setShowTable1] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
    }
  }, [isOpen]);
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
        <div className="flex items-center justify-end p-4 border-b gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>
           {/* Base Name */}
        <div className="flex p-4 items-center gap-4">
          <div className="w-[20%]">Base Name</div>
          <input
            placeholder="Describe your base name..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Table Name */}
        <div className="flex p-4 items-center gap-4">
          <div className="w-[20%]">Table Name</div>
          <input
            placeholder="Describe your table name..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Button */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => setShowTable1(!showTable1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Table 1
          </button>
        </div>

        {/* Show table fields when button clicked */}
        {showTable1 && (
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-4">Table 1</h3>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-[20%]">Name</div>
              <input
                placeholder="Column Name"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-[20%]">Type</div>
              <select className="flex-1 p-2 border border-gray-300 rounded-md">
                <option>String</option>
                <option>Number</option>
                <option>Boolean</option>
                <option>Date</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 