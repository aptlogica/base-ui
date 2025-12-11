import React from 'react';
import { SidebarTableSkeleton } from './SidebarTableSkeleton';
import { Skeleton } from './Skeleton';

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
      {Array.from({ length: itemCount }).map((_, index) => (
        <SidebarTableSkeleton 
          key={index} 
          showViews={index < 3} // Show views for first 3 tables
        />
      ))}
    </div>
  );
});

SidebarSkeleton.displayName = 'SidebarSkeleton';

