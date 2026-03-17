// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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
