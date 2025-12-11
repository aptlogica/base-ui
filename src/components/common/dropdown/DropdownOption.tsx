import React from 'react';
import { Check } from 'lucide-react';
import { DropdownOption as DropdownOptionType } from '../../../types/dropdown';

interface DropdownOptionProps<T> {
  option: DropdownOptionType<T>;
  isSelected: boolean;
  isFocused: boolean;
  multiple: boolean;
  onClick: () => void;
}

export function DropdownOption<T>({
  option,
  isSelected,
  isFocused,
  multiple,
  onClick,
}: DropdownOptionProps<T>) {
  const baseClasses = `
    flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-md
    transition-all duration-150 ease-in-out relative
  `;

  const stateClasses = `
    ${isFocused ? 'bg-blue-50 border-blue-200' : ''}
    ${isSelected && !multiple ? 'bg-blue-600 text-white' : ''}
    ${isSelected && multiple ? 'bg-blue-50 text-blue-900' : ''}
    ${!isSelected && !isFocused ? 'hover:bg-gray-50' : ''}
    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <li
      className={`${baseClasses} ${stateClasses}`}
      onClick={option.disabled ? undefined : onClick}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {option.icon && (
          <div className="flex-shrink-0 w-4 h-4 text-gray-500">
            {option.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${isSelected && !multiple ? 'text-black' : 'text-gray-900'}`}>
            {option.label}
          </div>
          {option.description && (
            <div className={`text-sm ${isSelected && !multiple ? 'text-blue-100' : 'text-gray-500'}`}>
              {option.description}
            </div>
          )}
        </div>
      </div>
      
      {(isSelected || (multiple && isSelected)) && (
        <div className="flex-shrink-0 ml-2">
          {multiple ? (
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-300'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          ) : (
            <Check className="w-4 h-4" />
          )}
        </div>
      )}
    </li>
  );
}