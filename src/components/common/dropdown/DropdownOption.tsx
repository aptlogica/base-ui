import { Check } from 'lucide-react';
import { DropdownOption as DropdownOptionType } from '../../../types/dropdown';

interface DropdownOptionProps<T> {
  readonly option: DropdownOptionType<T>;
  readonly isSelected: boolean;
  readonly isFocused: boolean;
  readonly multiple: boolean;
  readonly onClick: () => void;
}

export function DropdownOption<T>({
  option,
  isSelected,
  isFocused,
  multiple,
  onClick,
}: DropdownOptionProps<T>) {
  const baseClasses = `
    flex items-center justify-between px-3 py-2.5 cursor-pointer
    transition-all duration-150 ease-in-out relative
  `;

  const selectedClass = isSelected ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-[var(--color-text-primary)]';
  const stateClasses = `
    ${isFocused ? 'bg-[var(--color-bg-brand-primary)] border-l-4 border-l-gray-400' : ''}
    ${selectedClass}
    ${!isSelected && !isFocused ? 'hover:bg-[var(--color-bg-brand-primary)] hover:text-black' : ''}
    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <li //NOSONAR
      className={`${baseClasses} ${stateClasses} rounded-xl`}
      onClick={option.disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (option.disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-selected={isSelected}
      aria-disabled={option.disabled}
      tabIndex={option.disabled ? -1 : 0}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {option.icon && (
          <div className="flex-shrink-0 w-4 h-4 text-gray-500">
            {option.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isSelected && !multiple ? 'text-black' : ''}`}>
            {option.label}
          </div>
          {option.description && (
            <div
              className={`text-sm mt-0.5 ${isSelected && !multiple ? 'var(--color-text-secondary)' : 'var(--color-text-placeholder)'} overflow-hidden`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
                maxHeight: '2.8em'
              }}
              title={option.description}
            >
              {option.description}
            </div>
          )}
        </div>
      </div>

      {option.rightLabel && (
        <div className="flex-shrink-0 ml-2 text-sm text-gray-500">
          {option.rightLabel}
        </div>
      )}

      {isSelected && (
        <div className="flex-shrink-0 ml-2">
          {multiple ? (
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected
              ? 'bg-[var(--color-bg-brand-primary)] border-[var(--color-bg-brand-primary)]'
              : 'border bg-black'
              }`}>
              <Check className="w-3 h-3 text-black" />
            </div>
          ) : (
            <Check className="w-4 h-4 text-[var(--color-bg-brand-primary)]" />
          )}
        </div>
      )}
    </li>
  );
}
