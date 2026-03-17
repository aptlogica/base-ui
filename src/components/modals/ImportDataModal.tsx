// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Import, X, ChevronRight } from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImportType: (type: string) => void;
}

interface ImportOption {
  id: string;
  label: string;
  description?: string;
  iconPath: string;
  bgColor: string;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    id: 'csv',
    label: 'CSV',
    iconPath: '/assets/csv.png',
    bgColor: 'bg-white',
  },
  {
    id: 'excel',
    label: 'Excel',
    iconPath: '/assets/docx.png', // Using docx icon as placeholder for Excel
    bgColor: 'bg-white',
  },
  {
    id: 'sql',
    label: 'SQL',
    iconPath: '/assets/sql.png',
    bgColor: 'bg-white',
  },
  {
    id: 'json',
    label: 'Json',
    iconPath: '/assets/json.png',
    bgColor: 'bg-white',
  },
];

const OPTIONAL_IMPORT_OPTIONS: ImportOption[] = [
  {
    id: 'airtable',
    label: 'Airtable',
    description: 'Import from Airtable',
    iconPath: '/assets/airtable.svg',
    bgColor: 'bg-white',
  },
  {
    id: 'nocodb',
    label: 'NocoDB',
    description: 'Import from NocoDB',
    iconPath: '/assets/nocodb.png', // Placeholder - you may want to add a NocoDB icon
    bgColor: 'bg-white',
  },
];

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onSelectImportType,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOptionClick = (optionId: string) => {
    // Only allow CSV to be clicked
    if (optionId !== 'csv') return;
    onSelectImportType(optionId);
    onClose();
  };

  const isOptionDisabled = (optionId: string) => {
    return optionId !== 'csv';
  };

  if (!isOpen) return null;

  return (
    <div //NOSONAR
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div //NOSONAR
        className="bg-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center">
              <Import size={20} className="icon-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Import data from</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-1 border rounded-xl">
          {IMPORT_OPTIONS.map((option) => {
            const isDisabled = isOptionDisabled(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 p-3 border-b last:border-b-0 transition-colors text-left group ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${option.bgColor} border flex items-center justify-center p-2`}>
                  <img 
                    src={option.iconPath} 
                    alt={option.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-primary">{option.label}</div>
                  {isDisabled ? (
                    <div className="text-sm text-secondary">Coming soon</div>
                  ) : (
                    option.description && (
                      <div className="text-sm text-secondary">{option.description}</div>
                    )
                  )}
                </div>
                {!isDisabled && (
                  <ChevronRight className="h-5 w-5 text-[var(--text-color-tertiary)] group-hover:text-primary" />
                )}
              </button>
            );
          })}

          {/* Optional Integrations */}
          {OPTIONAL_IMPORT_OPTIONS.length > 0 && (
            <>
              {OPTIONAL_IMPORT_OPTIONS.map((option) => {
                const isDisabled = isOptionDisabled(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={isDisabled}
                    className={`w-full border-b last:border-b-0 flex items-center gap-3 p-3 transition-colors text-left group ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${option.bgColor} border flex items-center justify-center p-2`}>
                      <img 
                        src={option.iconPath} 
                        alt={option.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-primary">{option.label}</div>
                      {isDisabled ? (
                        <div className="text-sm text-secondary">Coming soon</div>
                      ) : (
                        option.description && (
                          <div className="text-sm text-secondary">{option.description}</div>
                        )
                      )}
                    </div>
                    {!isDisabled && (
                      <ChevronRight className="h-5 w-5 text-[var(--text-color-tertiary)] group-hover:text-primary" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

