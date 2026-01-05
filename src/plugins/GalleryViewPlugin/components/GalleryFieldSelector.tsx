import React, { useState } from 'react';
import { Layers, Image } from 'lucide-react';
import { AdvancedDropdown } from '../../../components/common/dropdown/AdvancedDropdown';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { useSmartPopover } from '../../../hooks/useSmartPopover';
import { createPortal } from 'react-dom';
import type { BaseColumn } from '../../../types/column.types';

interface GalleryFieldConfigurationProps {
  columns: BaseColumn[];
  attachmentField?: BaseColumn;
  onAttachmentFieldChange: (field: BaseColumn | undefined) => void;
  className?: string;
}

export const GalleryFieldConfiguration: React.FC<GalleryFieldConfigurationProps> = ({
  columns,
  attachmentField,
  onAttachmentFieldChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const { position } = useSmartPopover({
    open: isOpen,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement>,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement>,
    margin: 8,
    preferred: { horizontal: 'right', vertical: 'bottom' },
    onOutsideClick: () => setIsOpen(false)
  });

  // Filter attachment columns
  const attachmentColumns = columns?.filter(col => 
    col.uidt === 'attachment' || col.type === 'attachment'
  );

  // Close on Escape
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-brand-primary)] text-black hover:bg-[var(--color-bg-brand-primary)] hover:text-black font-semibold rounded-xl transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Layers className="w-4 h-4" />
        <span>Gallery Fields</span>
      </button>

      {isOpen && position && createPortal(
        <div
          ref={panelRef}
          className="p-4 bg-card border rounded-xl shadow-lg z-50 min-w-[320px] max-w-[400px]"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <h3 className="text-sm font-semibold text-primary mb-4">Configure Gallery Fields</h3>
          
          <div className="space-y-4">
            {/* Image Field */}
            <div>
              <AdvancedDropdown
                label="Image Field"
                options={attachmentColumns
                  .filter(col => col.id != null)
                  .map(col => ({
                    label: col.title || col.column_name || '',
                    value: String(col.id!),
                    icon: getFieldTypeIconWithMargin(col.uidt || 'text')
                  }))}
                value={attachmentField?.id ? String(attachmentField.id) : undefined}
                onChange={(val) => {
                  const field = attachmentColumns.find(col => String(col.id) === String(val));
                  onAttachmentFieldChange(field);
                }}
                placeholder="Select image field"
                searchable={true}
                helpText="The attachment field that will display images in the gallery"
                className="w-full"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

