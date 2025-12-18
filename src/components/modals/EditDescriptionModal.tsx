import React, { useState, useEffect } from 'react';
import { Table2 } from 'lucide-react';

interface EditDescriptionModalProps {
  isOpen: boolean;
  initialValue?: string;
  onClose: () => void;
  onSave: (desc: string) => void;
}

const EditDescriptionModal: React.FC<EditDescriptionModalProps> = ({ isOpen, initialValue, onClose, onSave }) => {
  // Defensive default so callers can omit `initialValue`
  const [desc, setDesc] = useState(initialValue ?? '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDesc(initialValue ?? '');
    setDirty(false);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <div className="flex items-center gap-2 mb-4">
          <Table2 size={20} color="#3b82f6" />
          <span className="text-lg font-semibold">{desc ? 'Edit Description' : 'Add Description'}</span>
        </div>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none"
          placeholder="Enter table description..."
          value={desc}
          onChange={e => { setDesc(e.target.value); setDirty(true); }}
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold ${!dirty ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => { if (dirty) onSave(desc); }}
            disabled={!dirty}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDescriptionModal; 