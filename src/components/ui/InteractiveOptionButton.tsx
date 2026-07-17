// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';

interface InteractiveOptionButtonProps {
  id: string;
  label: string;
  value: string;
  onClick: (value: string) => void;
  disabled?: boolean;
  align?: 'left' | 'center' | 'right';
  isSelected?: boolean;
  hasSelection?: boolean;
}

export const InteractiveOptionButton: React.FC<InteractiveOptionButtonProps> = ({
  id,
  label,
  value,
  onClick,
  disabled = false,
  align = 'left',
  isSelected = false,
  hasSelection = false,
}) => {
   const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];
  return (
    <button
      key={id}
      onClick={() => onClick(value)}
      disabled={disabled}
      className={`w-full px-4 py-2 text-sm font-semibold not-italic rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${alignClass} ${
        !hasSelection || isSelected
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          : 'bg-[#E5E5E5] text-[#727274] hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );
};
