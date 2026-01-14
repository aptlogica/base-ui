import { Check } from 'lucide-react';
import { DropdownOption as DropdownOptionType } from '../../../types/dropdown';

interface DropdownOptionProps<T> {
  readonly option: DropdownOptionType<T>;
  readonly isSelected: boolean;
  readonly isFocused: boolean;
  readonly multiple: boolean;
  readonly onClick: () => void;
}

// Helper function to build state classes - extracted to reduce complexity
function buildStateClasses(isFocused: boolean, isSelected: boolean, multiple: boolean, disabled: boolean): string {
  const classes: string[] = [];
  
  if (isFocused) {
    classes.push('bg-blue-50 border-blue-200');
  }
  
  if (isSelected && !multiple) {
    classes.push('bg-blue-600 text-white');
  }
  
  if (isSelected && multiple) {
    classes.push('bg-blue-50 text-blue-900');
  }
  
  if (!isSelected && !isFocused) {
    classes.push('hover:bg-gray-50');
  }
  
  if (disabled) {
    classes.push('opacity-50 cursor-not-allowed');
  }
  
  return classes.join(' ');
}

// Helper function to handle keyboard events - extracted to reduce complexity
function createKeyboardHandler(disabled: boolean, onClick: () => void) {
  if (disabled) return undefined;
  
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
}

// Checkmark component - extracted to reduce complexity
interface CheckmarkProps {
  readonly isSelected: boolean;
  readonly multiple: boolean;
}

function Checkmark({ isSelected, multiple }: CheckmarkProps) {
  if (!isSelected) return null;
  
  if (multiple) {
    return (
      <div className="flex-shrink-0 ml-2">
        <div className="w-4 h-4 rounded border-2 flex items-center justify-center bg-blue-600 border-blue-600">
          <Check className="w-3 h-3 text-white" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-shrink-0 ml-2">
      <Check className="w-4 h-4" />
    </div>
  );
}

// Content component - extracted to reduce complexity
interface OptionContentProps<T> {
  readonly option: DropdownOptionType<T>;
  readonly isSelected: boolean;
  readonly multiple: boolean;
}

function OptionContent<T>({ option, isSelected, multiple }: OptionContentProps<T>) {
  const labelColor = isSelected && !multiple ? 'text-black' : 'text-gray-900';
  const descriptionColor = isSelected && !multiple ? 'text-blue-100' : 'text-gray-500';
  
  return (
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      {option.icon && (
        <div className="flex-shrink-0 w-4 h-4 text-gray-500">
          {option.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${labelColor}`}>
          {option.label}
        </div>
        {option.description && (
          <div className={`text-sm ${descriptionColor}`}>
            {option.description}
          </div>
        )}
      </div>
    </div>
  );
}

export function DropdownOption<T>({
  option,
  isSelected,
  isFocused,
  multiple,
  onClick,
}: DropdownOptionProps<T>) {
  const baseClasses = 'flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-md transition-all duration-150 ease-in-out relative';
  const isDisabled = Boolean(option.disabled);
  const stateClasses = buildStateClasses(isFocused, isSelected, multiple, isDisabled);
  const handleKeyDown = createKeyboardHandler(isDisabled, onClick);
  const handleClick = isDisabled ? undefined : onClick;
  const optionValue = option.value === undefined ? undefined : String(option.value);
  const tabIndex = isDisabled ? -1 : 0;

  return (
    <option
      className={`${baseClasses} ${stateClasses}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      value={optionValue}
      tabIndex={tabIndex}
    >
      <OptionContent option={option} isSelected={isSelected} multiple={multiple} />
      <Checkmark isSelected={isSelected} multiple={multiple} />
    </option>
  );
}