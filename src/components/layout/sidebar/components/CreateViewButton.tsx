import React, { useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { CreateViewPopover } from './CreateViewPopover';
import { CreateViewButtonProps } from '../types';

export const CreateViewButton: React.FC<CreateViewButtonProps> = ({ 
  table, 
  onOpenModal, 
  setPopoverRef 
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        className="flex w-full items-center gap-2 text-left font-semibold bg-[var(--color-gray-100)] text-secondary hover:text-[var(--color-gray-800)] mb-1 mt-1 pl-7 pr-3 py-1 rounded-xl transition"
        onClick={() => setOpen(v => !v)}
      >
        <LucideIcons.Plus size={12} /> Create View
      </button>
      {open && (
        <CreateViewPopover 
          anchorRef={btnRef as React.RefObject<HTMLElement>} 
          onOpenModal={type => { 
            onOpenModal(type); 
            setOpen(false); 
          }} 
          onClose={() => setOpen(false)} 
          setPopoverRef={setPopoverRef} 
        />
      )}
    </div>
  );
};

