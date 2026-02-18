import React from 'react';
import { Loader } from '../ui/Loader';

interface LoadMoreButtonProps {
  isLoading: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  isLoading,
  onClick,
  label,
  disabled
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="px-6 py-2.5 text-sm font-medium rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading ? <Loader size={4} /> : <span>{label}</span>}
    </button>
  );
};
