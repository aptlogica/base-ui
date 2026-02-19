import React from 'react';
import { Check } from 'lucide-react';
import { getOptionColorClass, getReadableTextColor } from '../../../utils/optionColorUtils';
import { SelectOption } from './selectOptions';

interface SelectOptionsMenuProps {
  options: SelectOption[];
  isSelected: (option: SelectOption) => boolean;
  isDisabled?: (option: SelectOption) => boolean;
  onSelect: (option: SelectOption) => void;
  readOnly?: boolean;
  emptyMessage?: string;
  className?: string;
  optionClassName?: (option: SelectOption, isSelected: boolean, isDisabled: boolean) => string;
}

export const SelectOptionsMenu: React.FC<SelectOptionsMenuProps> = ({
  options,
  isSelected,
  isDisabled,
  onSelect,
  readOnly = false,
  emptyMessage = 'No options available',
  className = '',
  optionClassName,
}) => {
  if (options.length === 0) {
    return <div className="px-3 py-2 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <>
      {options.map((opt, index) => {
        const selected = isSelected(opt);
        const disabled = readOnly || (isDisabled ? isDisabled(opt) : false);
        const classes = optionClassName
          ? optionClassName(opt, selected, disabled)
          : `w-full text-left text-sm rounded-xl flex items-center justify-between ${disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'cursor-pointer'
          } ${selected ? 'text-black font-bold' : ''}`;

        return (
          <button
            type="button"
            key={`${opt.option}-${index}`}
            onClick={() => !disabled && onSelect(opt)}
            disabled={disabled}
            className={classes}
          >
            <div
              className={`inline-flex justify-between items-center w-full p-1 px-2 rounded-full text-xs min-w-0 ${opt.color ? '' : getOptionColorClass(index)} ${disabled ? 'opacity-50' : ''}`}
              style={opt.color ? { backgroundColor: opt.color, color: getReadableTextColor(opt.color) } : undefined}
            >
              <span className="truncate" title={opt.option}>{opt.option}</span>
              {selected && (
                <Check
                  className="w-4 h-4 flex-shrink-0 ml-1"
                  style={{ color: opt.color ? getReadableTextColor(opt.color) : '#000000' }}
                />
              )}
            </div>
          </button>
        );
      })}
    </>
  );
};
