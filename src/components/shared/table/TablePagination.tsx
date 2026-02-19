import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm border rounded-lg text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        ← Previous
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 text-sm rounded-lg ${currentPage === page
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {page}
              </button>
            );
          }
          if (page === currentPage - 2 || page === currentPage + 2) {
            return <span key={page} className="px-2 text-sm text-gray-500">...</span>;
          }
          return null;
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm border rounded-lg text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        Next →
      </button>
    </div>
  );
};
