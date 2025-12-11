import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BasesDropdownProps } from '../types';
import { useWorkspaceAccess } from '../../../../../hooks/useWorkspaceAccess';

export const BasesDropdown: React.FC<BasesDropdownProps> = ({
  workspaceBases,
  basesLoading,
  selectedBase,
  currentWorkspace,
  onSelectBase,
  onCreateBase
}) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const { canCreateBase } = useWorkspaceAccess(currentWorkspace?.id);

  useEffect(() => {
    const updatePosition = () => {
      const trigger = document.querySelector('.bases-dropdown-trigger');
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
    };

    // Update position initially and on window resize
    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  return (
    <div
      className="bases-dropdown fixed w-64 bg-background border rounded-xl shadow-xl z-[9999] overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-2">
        <div className="text-tertiary mb-1 px-2 uppercase tracking-wide">
          Bases
        </div>
        <div className="space-y-1">
          {(() => {
            const bases = workspaceBases?.data || [];

            // Check if we have a current workspace
            if (!currentWorkspace) {
              return (
                <div className="text-gray-500 text-sm px-2 py-2 text-center">
                  Please select a workspace
                </div>
              );
            }

            if (basesLoading) {
              return (
                <div className="text-gray-500 text-sm px-2 py-2 text-center">
                  Loading bases...
                </div>
              );
            }

            if (bases.length === 0) {
              return (
                <div className="text-gray-500 text-sm px-2 py-2 text-center">
                  No bases found in this workspace
                </div>
              );
            }

            return bases.map((base: any) => (
              <button
                key={base.id}
                className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-all duration-200 ${selectedBase?.id === base.id
                  ? 'bg-[var(--color-gray-50)] text-tertiary border'
                  : 'text-tertiary'
                  }`}
                onClick={() => onSelectBase(base)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-100 border rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{base.title}</div>
                  </div>
                  {selectedBase?.id === base.id && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ));
          })()}
        </div>
        {canCreateBase() && (
          <div className="border-t border-border mt-1 pt-1">
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded-lg transition-all duration-200 font-medium flex items-center gap-3"

              onClick={onCreateBase}
            >
              <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                <Plus className="w-4 h-4 text-black" />
              </div>
              Create Base
            </button>
          </div>
        )}
      </div>
    </div>
  );
};