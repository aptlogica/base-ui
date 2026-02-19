import React from 'react';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { FieldConfigPopover } from '../../shared/FieldConfigPopover';
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
  // Filter attachment columns
  const attachmentColumns = columns?.filter(col => 
    col.uidt === 'attachment' || col.type === 'attachment'
  );

  return (
    <FieldConfigPopover
      buttonLabel="Gallery Fields"
      title="Configure Gallery Fields"
      dropdownLabel="Image Field"
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
      helpText="The attachment field that will display images in the gallery"
      className={className}
    />
  );
};

