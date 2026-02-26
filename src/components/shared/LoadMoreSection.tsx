import React from 'react';
import { LoadMoreButton } from './LoadMoreButton';

interface LoadMoreSectionProps {
  isVisible: boolean;
  isLoading: boolean;
  label: string;
  onLoadMore: () => void;
  className?: string;
}

export const LoadMoreSection: React.FC<LoadMoreSectionProps> = ({
  isVisible,
  isLoading,
  label,
  onLoadMore,
  className = 'py-4',
}) => {
  if (!isVisible) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <LoadMoreButton
        onClick={onLoadMore}
        isLoading={isLoading}
        label={label}
      />
    </div>
  );
};
