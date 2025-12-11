import React from 'react';
import { Skeleton } from './Skeleton';

export const SidebarTableSkeleton: React.FC<{ showViews?: boolean }> = ({ 
  showViews = true 
}) => {
  return (
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
};

