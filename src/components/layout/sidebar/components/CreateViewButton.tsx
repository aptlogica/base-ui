import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateViewPopover } from './CreateViewPopover';
import { CreateViewButtonProps } from '../types';

export const CreateViewButton: React.FC<CreateViewButtonProps> = ({
  table: _table,
  onOpenModal,
  setPopoverRef
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        className="flex w-full items-center gap-2 text-left hover:bg-[var(--color-gray-100)] text-[var(--color-brand-700)] my-1 pl-10 pr-3 py-1 rounded-xl transition-all ease-in duration-200"
        onClick={() => setOpen(v => !v)}
      >
        <Plus className="h-5 w-5 text-[var(--color-brand-700)]" /> Create View
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

