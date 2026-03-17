// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Skeleton } from './Skeleton';

const renderTableSkeleton = (showViews: boolean) => (
  <div className="mb-2 space-y-1">
    {/* Table item skeleton */}
    <div className="flex items-center gap-3 py-2 pr-3 pl-7">
      <Skeleton variant="circular" width={15} height={15} />
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width={16} height={16} className="ml-auto" />
    </div>
    
    {/* Nested views skeleton */}
    {showViews && (
      <div className="pl-7 space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-1 pr-3 pl-6">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        ))}
      </div>
    )}
  </div>
);

export const SidebarSkeleton: React.FC<{ itemCount?: number }> = React.memo(({ 
  itemCount = 5 
}) => {
  return (
    <div className="space-y-2">
      {/* Create View Button skeleton */}
      <div className="mb-2 px-2">
        <Skeleton variant="rectangular" width="100%" height={32} />
      </div>
      
      {/* Table skeletons */}
      {Array.from({ length: itemCount }, (_, index) => {
        const skeletonId = `sidebar-table-skeleton-${index}`;
        return (
          <div key={skeletonId}>
            {renderTableSkeleton(index < 3)}
          </div>
        );
      })}
    </div>
  );
});

SidebarSkeleton.displayName = 'SidebarSkeleton';

