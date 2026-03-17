// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { FormField } from '../../../../types/form';
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { FIELD_TYPES } from '../../../../types/fieldTypes';

interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
  onToggle?: (fieldId: string) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onDelete?: (fieldId: string) => void;
}

export const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  isSelected,
  onSelect,
  onToggle,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart = () => { },
  onDragOver = () => { },
  onDrop = () => { },
  onDragEnd = () => { },
  onDelete,
}) => {
  return (
    <div //NOSONAR
      style={{ opacity: isDragging ? 0.5 : 1 }}
      draggable={draggable}
      onDragStart={e => { e.stopPropagation(); onDragStart(); }}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragEnd={e => { e.stopPropagation(); onDragEnd(); }}
      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
        ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-border/60 hover:bg-muted/50'}
        ${isDragging ? 'opacity-50 border-dashed border-2 border-primary' : ''}
        ${isDragOver ? 'bg-muted/50' : ''}
        ${field.is_hidden ? 'bg-muted/30 text-muted-foreground cursor-not-allowed' : ''}`}
      onClick={() => {
        // Only trigger select if not dragging
        if (!isDragging) {
          onSelect(field.id);
        }
      }}
      onKeyDown={(e) => {
        // Support keyboard interaction (Enter or Space to select)
        if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
          e.preventDefault();
          onSelect(field.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select field ${field.name}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          className="flex items-center cursor-grab active:cursor-grabbing p-1 rounded bg-transparent border-none"
          onMouseDown={(e) => {
            // Prevent the click event from firing when starting drag
            e.stopPropagation();
          }}
          aria-label="Drag to reorder field"
          tabIndex={0}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground mr-2" />
          {(() => {
            const fieldType = FIELD_TYPES.find(type => type?.key === field?.type);
            const IconComponent = fieldType?.icon;
            return IconComponent ? <IconComponent className="w-5 h-5 text-gray-500" /> : null;
          })()}
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">{field.name}</p>
          <p className="text-xs text-secondary capitalize">{field.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        {onToggle && (
          <button
            className="p-1.5 rounded-md bg-background border hover:bg-gray-200 transition-colors"
            title={field.is_hidden ? 'Show field' : 'Hide field'}
            onClick={e => {
              e.stopPropagation();
              onToggle(field.id);
            }}
          >
            {field.is_hidden ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
          </button>
        )}
        {onDelete && (
          <button
            type='button'
            className="p-1.5 text-red-500 hover:text-red-700 bg-background border rounded-md hover:bg-red-200 transition-colors"
            title="Delete field"
            onClick={e => {
              e.stopPropagation();
              onDelete(field.id);
            }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};