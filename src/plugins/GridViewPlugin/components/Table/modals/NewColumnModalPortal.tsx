import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
const NewColumnModal = lazy(() => 
  import('../../../../../components/modals/NewColumnModal').then(m => ({ default: m.NewColumnModal }))
);
import { Loader } from '../../../../../components/ui/Loader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  addColumnButtonRef: React.RefObject<HTMLButtonElement> | null;
  tableId?: string;
  onAddColumn?: (newCol: any) => void;
  fields?: any[];
  isAddNewColumn?: boolean;
  excludeRefs?: React.RefObject<HTMLElement | null>[];
}

export const NewColumnModalPortal = React.forwardRef<HTMLDivElement, Props>(({ isOpen, onClose, addColumnButtonRef, ...props }, ref) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !addColumnButtonRef?.current) return;
    const rect = addColumnButtonRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX - 420; // modal width offset
    setPosition({ top, left: Math.max(8, left) });
  }, [isOpen, addColumnButtonRef]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleMouseDown(e: MouseEvent) {
      if (modalRef.current && !(modalRef.current as any).contains(e.target)) onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  const { onAddColumn, fields = [], isAddNewColumn = false, excludeRefs = [] } = props;

  return createPortal(
    <div
      ref={ref}
      className="absolute z-50"
      style={{ top: position.top, left: position.left, width: 420 }}
    >
      <Suspense fallback={
        <div className="bg-background border border-border rounded-xl shadow-lg p-8 min-w-[400px]">
          <Loader size={8} />
        </div>
      }>
        <NewColumnModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={onAddColumn || (() => {})}
          fields={fields}
          isAddNewColumn={isAddNewColumn}
          excludeRefs={excludeRefs}
          currentTableId={props.tableId}
        />
      </Suspense>
    </div>,
    document.body
  );
});

NewColumnModalPortal.displayName = 'NewColumnModalPortal';
