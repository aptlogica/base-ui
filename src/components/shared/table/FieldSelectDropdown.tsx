// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Check, ChevronDown, ChevronUp, Type } from 'lucide-react';
import { getFieldTypeIconComponent, getRelationTypeFromField } from '../../../types/fieldTypes';

export interface FieldSelectOption {
  key: string;
  title: string;
  uidt?: string;
  type?: string;
  meta?: {
    relation?: {
      type?: string;
    };
  };
}

interface FieldSelectDropdownProps {
  options: FieldSelectOption[];
  selectedKey?: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
  placeholder?: string;
  menuTestId?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: (option: FieldSelectOption, isSelected: boolean) => string;
  labelClassName?: (option: FieldSelectOption, isSelected: boolean) => string;
  emptyMessage?: string;
  showCheck?: boolean;
  iconClassName?: string;
}

export const FieldSelectDropdown: React.FC<FieldSelectDropdownProps> = ({
  options,
  selectedKey,
  isOpen,
  onToggle,
  onSelect,
  placeholder = 'Select field',
  menuTestId,
  buttonClassName = '',
  menuClassName = '',
  optionClassName,
  labelClassName,
  emptyMessage = 'All fields already used',
  showCheck = true,
  iconClassName = 'w-4 h-4',
}) => {
  const selectedOption = selectedKey ? options.find(option => option.key === selectedKey) : undefined;

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-left">
          {selectedOption ? (
            <span className="flex-1 text-left flex items-center text-primary">
              <span className="mr-2 align-middle text-primary">
                {getFieldTypeIconComponent(
                  selectedOption.uidt || selectedOption.type || 'text',
                  iconClassName,
                  getRelationTypeFromField(selectedOption)
                ) || (
                  <Type className="w-4 h-4 text-gray-400" />
                )}
              </span>
              <span className={`${labelClassName ? labelClassName(selectedOption, true) : ''} text-primary`}>
                {selectedOption.title}
              </span>
            </span>
          ) : (
            <span className="text-secondary">{placeholder}</span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div
          className={menuClassName}
          data-testid={menuTestId}
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-secondary">{emptyMessage}</div>
          )}
          {options.map((option) => {
            const isSelected = option.key === selectedKey;
            const optionClasses = optionClassName
              ? optionClassName(option, isSelected)
              : '';
            const labelClasses = labelClassName
              ? labelClassName(option, isSelected)
              : '';

            return (
              <button
                key={option.key}
                className={optionClasses}
                onClick={() => onSelect(option.key)}
                type="button"
              >
                <span className="text-gray-500">
                  {getFieldTypeIconComponent(
                    option.uidt || option.type || 'text',
                    iconClassName,
                    getRelationTypeFromField(option)
                  ) || (
                    <Type className="w-4 h-4 text-gray-400" />
                  )}
                </span>
                <span className={labelClasses}>{option.title}</span>
                {showCheck && isSelected && <Check className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
