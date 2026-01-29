import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SortableFormField } from './SortableFormField';
import { FormField, FormConfig } from '../../../../types/form';
import { isFormulaField } from '../../../../utils/fieldUtils';

interface FormPreviewProps {
  config: FormConfig;
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  onFieldOrderChange: (newFields: FormField[]) => void;
  onClear?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  onDeleteField: (fieldId: string) => void;
  formError?: string | null;
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  onConfigChange?: (updates: Partial<FormConfig>) => void;
  isReadOnly?: boolean;
}

// Extract field filtering logic
const shouldIncludeField = (field: FormField): boolean => {
  if (field.title?.toLowerCase().includes('title') || field.column_name === 'title') {
    return !field.is_hidden;
  }

  const auditFieldTitles = ['Created Time', 'Last Modified Time', 'Created By', 'Last Modified By'];
  if (field.title && auditFieldTitles.includes(field.title)) {
    return false;
  }

  if (isFormulaField(field)) {
    return false;
  }

  const systemFieldNames = ['id', 'created_at', 'updated_at'];
  if (field.system && field.column_name && systemFieldNames.includes(field.column_name.toLowerCase())) {
    return false;
  }

  return !field.is_hidden;
};

// Extract appearance style computation
interface AppearanceStyles {
  containerWidth: string;
  cardStyle: string;
  rounded: string;
  titleAlign: string;
}

const computeAppearanceStyles = (appearance: FormConfig['appearance']): AppearanceStyles => {
  const appearanceConfig = appearance || {};

  const containerWidth = {
    narrow: 'max-w-md',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl',
    full: 'max-w-full'
  }[appearanceConfig.layoutWidth as string] || 'max-w-2xl';

  const cardStyle = appearanceConfig.cardStyle === 'elevated' ? 'shadow-lg' : 'shadow-sm';

  const rounded = {
    none: 'rounded-none',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-xl'
  }[appearanceConfig.rounded as string] || 'rounded-xl';

  const titleAlign = appearanceConfig.align === 'center' ? 'text-center' : 'text-left';

  return { containerWidth, cardStyle, rounded, titleAlign };
};
interface EditableTitleProps {
  title: string;
  isEditing: boolean;
  editedTitle: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  textColor?: string;
}

const handleTitleKeyDown = (e: React.KeyboardEvent, onSave: () => void, onCancel: () => void) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    onSave();
  } else if (e.key === 'Escape') {
    onCancel();
  }
};

const handleViewKeyDown = (e: React.KeyboardEvent, onStartEdit: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onStartEdit();
  }
};

const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  isEditing,
  editedTitle,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  isReadOnly,
  canEdit,
  textColor
}) => {
  if (isEditing && !isReadOnly) {
    return (
      <input
        type="text"
        value={editedTitle}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => handleTitleKeyDown(e, onSave, onCancel)}
        className="mb-4 w-full text-2xl font-bold focus:outline-none bg-gray-100 border-none p-4 rounded-xl"
        style={{ color: textColor || undefined }}
        autoFocus
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="mb-4 text-left text-2xl font-bold p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full"
        style={{ color: textColor || undefined}}
        onClick={onStartEdit}
        onKeyDown={(e) => handleViewKeyDown(e, onStartEdit)}
        aria-label="Click to edit title"
      >
        {title}
      </button>
    );
  }

  return (
    <h1
      className="mb-4 text-2xl font-bold p-4 rounded-xl"
      style={{ color: textColor || undefined }}
    >
      {title}
    </h1>
  );
};

// Extract editable description component
interface EditableDescriptionProps {
  description: string | null | undefined;
  isEditing: boolean;
  editedDescription: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  textColor?: string;
}

const handleDescriptionKeyDown = (e: React.KeyboardEvent, onCancel: () => void) => {
  if (e.key === 'Escape') {
    onCancel();
  }
};

const renderDescriptionContent = (description: string | null | undefined, textColor?: string) => {
  if (description) {
    return (
      <p className="leading-relaxed" style={{ color: textColor || undefined }}>
        {description}
      </p>
    );
  }
  return (
    <p className="leading-relaxed text-gray-400 italic" style={{ color: textColor || undefined }}>
      Add form description
    </p>
  );
};

const EditableDescription: React.FC<EditableDescriptionProps> = ({
  description,
  isEditing,
  editedDescription,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  isReadOnly,
  canEdit,
  textColor
}) => {
  if (isEditing && !isReadOnly) {
    return (
      <textarea
        value={editedDescription}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => handleDescriptionKeyDown(e, onCancel)}
        placeholder="Add form description"
        rows={2}
        className="mb-4 w-full text-sm leading-relaxed focus:outline-none resize-none bg-gray-100 border-none p-4 rounded-xl"
        style={{ color: textColor || undefined }}
        autoFocus
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="mb-4 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
        onClick={onStartEdit}
        onKeyDown={(e) => handleViewKeyDown(e, onStartEdit)}
        aria-label="Click to edit description"
      >
        {renderDescriptionContent(description, textColor)}
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-xl">
      {renderDescriptionContent(description, textColor)}
    </div>
  );
};

// Extract form fields list component
interface FormFieldsListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  draggedFieldId: string | null;
  dragOverFieldId: string | null;
  onDragStart: (fieldId: string) => void;
  onDragOver: (fieldId: string) => void;
  onDrop: (fieldId: string) => void;
  onDragEnd: () => void;
  onDeleteField: (fieldId: string) => void;
  appearance: FormConfig['appearance'];
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly: boolean;
  isGridLayout: boolean;
}

interface RenderFormFieldParams {
  field: FormField;
  index: number;
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  draggedFieldId: string | null;
  dragOverFieldId: string | null;
  onDragStart: (fieldId: string) => void;
  onDragOver: (fieldId: string) => void;
  onDrop: (fieldId: string) => void;
  onDragEnd: () => void;
  onDeleteField: (fieldId: string) => void;
  appearance: FormConfig['appearance'];
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly: boolean;
  isGridLayout: boolean;
}

const getFormFieldDragHandlers = (
  isReadOnly: boolean,
  fieldId: string,
  onDragStart: (fieldId: string) => void,
  onDragOver: (fieldId: string) => void,
  onDrop: (fieldId: string) => void,
  onDragEnd: () => void
) => {
  if (isReadOnly) {
    return {
      onDragStart: undefined,
      onDragOver: undefined,
      onDrop: undefined,
      onDragEnd: undefined
    };
  }
  return {
    onDragStart: () => onDragStart(fieldId),
    onDragOver: () => onDragOver(fieldId),
    onDrop: () => onDrop(fieldId),
    onDragEnd
  };
};

const getFormFieldClasses = (isGridLayout: boolean) => {
  return {
    containerClass: isGridLayout ? '' : 'flex items-center',
    innerClass: isGridLayout ? 'w-full' : 'flex-1'
  };
};

const renderFormField = (params: RenderFormFieldParams) => {
  const {
    field,
    index,
    selectedFieldId,
    rowData,
    onRowDataChange,
    draggedFieldId,
    dragOverFieldId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDeleteField,
    appearance,
    model_id,
    row_id,
    onEdit,
    isReadOnly,
    isGridLayout
  } = params;

  const { containerClass, innerClass } = getFormFieldClasses(isGridLayout);
  const dragHandlers = getFormFieldDragHandlers(isReadOnly, field.id, onDragStart, onDragOver, onDrop, onDragEnd);
  const fieldValue = rowData[field.id] ?? '';
  const isSelected = selectedFieldId === field.id;
  const isDragging = draggedFieldId === field.id;
  const isDragOver = dragOverFieldId === field.id;

  return (
    <div key={field.id + index} className={containerClass}>
      <div className={innerClass}>
        <SortableFormField
          field={field}
          isSelected={isSelected}
          value={fieldValue}
          onChange={(val: unknown) => onRowDataChange(field.id, val)}
          draggable={!isReadOnly}
          isDragging={isDragging}
          isDragOver={isDragOver}
          onDragStart={dragHandlers.onDragStart}
          onDragOver={dragHandlers.onDragOver}
          onDrop={dragHandlers.onDrop}
          onDragEnd={dragHandlers.onDragEnd}
          onDelete={isReadOnly ? undefined : onDeleteField}
          appearance={appearance}
          model_id={model_id}
          row_id={row_id}
          onEdit={onEdit}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
};

const FormFieldsList: React.FC<FormFieldsListProps> = ({
  fields,
  selectedFieldId,
  rowData,
  onRowDataChange,
  draggedFieldId,
  dragOverFieldId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDeleteField,
  appearance,
  model_id,
  row_id,
  onEdit,
  isReadOnly,
  isGridLayout
}) => {
  return (
    <>
      {fields.map((field, index) =>
        renderFormField({
          field,
          index,
          selectedFieldId,
          rowData,
          onRowDataChange,
          draggedFieldId,
          dragOverFieldId,
          onDragStart,
          onDragOver,
          onDrop,
          onDragEnd,
          onDeleteField,
          appearance,
          model_id,
          row_id,
          onEdit,
          isReadOnly,
          isGridLayout
        })
      )}
    </>
  );
};

// Extract form header component
interface FormHeaderProps {
  appearance: FormConfig['appearance'];
  styles: AppearanceStyles;
  title: string;
  description: string | null | undefined;
  isEditingTitle: boolean;
  isEditingDescription: boolean;
  editedTitle: string;
  editedDescription: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onDescriptionSave: () => void;
  onDescriptionCancel: () => void;
  onStartEditTitle: () => void;
  onStartEditDescription: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  formError?: string | null;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  appearance,
  styles,
  title,
  description,
  isEditingTitle,
  isEditingDescription,
  editedTitle,
  editedDescription,
  onTitleChange,
  onDescriptionChange,
  onTitleSave,
  onTitleCancel,
  onDescriptionSave,
  onDescriptionCancel,
  onStartEditTitle,
  onStartEditDescription,
  isReadOnly,
  canEdit,
  formError
}) => {
  return (
    <div className={`mb-8 ${styles.titleAlign}`}>
      <EditableTitle
        title={title}
        isEditing={isEditingTitle}
        editedTitle={editedTitle}
        onEditChange={onTitleChange}
        onSave={onTitleSave}
        onCancel={onTitleCancel}
        onStartEdit={onStartEditTitle}
        isReadOnly={isReadOnly}
        canEdit={canEdit}
        textColor={appearance?.textColor}
      />

      <EditableDescription
        description={description}
        isEditing={isEditingDescription}
        editedDescription={editedDescription}
        onEditChange={onDescriptionChange}
        onSave={onDescriptionSave}
        onCancel={onDescriptionCancel}
        onStartEdit={onStartEditDescription}
        isReadOnly={isReadOnly}
        canEdit={canEdit}
        textColor={appearance?.textColor}
      />

      {formError && (
        <div
          className="mb-4 p-3 rounded border"
          style={{
            backgroundColor: 'var(--color-bg-error-primary)',
            color: 'var(--color-text-error-primary)',
            borderColor: 'var(--color-border-error_subtle)'
          }}
        >
          {formError}
        </div>
      )}
    </div>
  );
};

// Extract form actions component
interface FormActionsProps {
  onSubmit?: (e: React.FormEvent) => void;
  onClear?: () => void;
  primaryColor?: string;
}

const FormActions: React.FC<FormActionsProps> = ({ onSubmit, onClear, primaryColor }) => {
  if (!onSubmit) return null;

  return (
    <div className="pt-6 flex gap-2">
      <button
        type="submit"
        className="flex-1 rounded-xl py-3 px-4 h-11 font-medium text-white transition-colors"
        style={{
          backgroundColor: primaryColor || '#2563eb',
          borderColor: primaryColor || '#2563eb'
        }}
      >
        Submit
      </button>
      {onClear && (
        <button
          type="button"
          className="flex-1 btn-tertiary rounded-xl py-3 px-4 h-11 font-medium"
          onClick={onClear}
        >
          Clear
        </button>
      )}
    </div>
  );
};

// Custom hook for drag and drop
const useDragAndDrop = (
  fields: FormField[],
  onFieldOrderChange: (newFields: FormField[]) => void
) => {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  const handleDragStart = useCallback((fieldId: string) => {
    setDraggedFieldId(fieldId);
  }, []);

  const handleDragOver = useCallback((fieldId: string) => {
    setDragOverFieldId(fieldId);
  }, []);

  const handleDrop = useCallback((fieldId: string) => {
    if (draggedFieldId && draggedFieldId !== fieldId) {
      const oldIndex = fields.findIndex(f => f.id === draggedFieldId);
      const newIndex = fields.findIndex(f => f.id === fieldId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = [...fields];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        onFieldOrderChange(updated);
      }
    }
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  }, [draggedFieldId, fields, onFieldOrderChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  }, []);

  return {
    draggedFieldId,
    dragOverFieldId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
};

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  selectedFieldId,
  rowData,
  onRowDataChange,
  onFieldOrderChange,
  onClear,
  onSubmit,
  onDeleteField,
  formError,
  model_id,
  row_id,
  onEdit,
  onConfigChange,
  isReadOnly = false
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(config.title);
  const [editedDescription, setEditedDescription] = useState(config.description || '');

  useEffect(() => {
    setEditedTitle(config.title);
    setEditedDescription(config.description || '');
  }, [config.title, config.description]);

  const {
    draggedFieldId,
    dragOverFieldId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(config.fields, onFieldOrderChange);

  const appearance = config.appearance || {};
  const styles = useMemo(() => computeAppearanceStyles(appearance), [appearance]);

  const handleTitleSave = useCallback(() => {
    if (onConfigChange && editedTitle.trim() !== config.title) {
      onConfigChange({ title: editedTitle.trim() || config.title });
    }
    setIsEditingTitle(false);
  }, [onConfigChange, editedTitle, config.title]);

  const handleTitleCancel = useCallback(() => {
    setEditedTitle(config.title);
    setIsEditingTitle(false);
  }, [config.title]);

  const handleDescriptionSave = useCallback(() => {
    if (onConfigChange && editedDescription.trim() !== (config.description || '')) {
      onConfigChange({ description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  }, [onConfigChange, editedDescription, config.description]);

  const handleDescriptionCancel = useCallback(() => {
    setEditedDescription(config.description || '');
    setIsEditingDescription(false);
  }, [config.description]);

  const visibleFields = useMemo(() => {
    return config.fields.filter(shouldIncludeField);
  }, [config.fields]);

  const isGridLayout = appearance.fieldLayout === 'grid-2';
  const canEdit = !!onConfigChange;

  return (
    <div className="min-h-screen" style={{ backgroundColor: appearance.backgroundColor || undefined }}>
      <div className={`${styles.containerWidth} mx-auto p-8`}>
        {!appearance.hideBanner && appearance.bannerUrl && (
          <div className="mb-8">
            <img src={String(appearance.bannerUrl)} alt="Banner" className="w-full h-48 object-cover rounded-xl" />
          </div>
        )}

        <div className={`bg-card ${styles.rounded} ${styles.cardStyle} p-6 border`}>
          {appearance.logoUrl && (
            <div className={`mb-6 ${styles.titleAlign === 'text-center' ? 'flex justify-center' : ''}`}>
              <img src={String(appearance.logoUrl)} alt="Logo" className="h-16 object-contain" />
            </div>
          )}

          <FormHeader
            appearance={appearance}
            styles={styles}
            title={config.title}
            description={config.description}
            isEditingTitle={isEditingTitle}
            isEditingDescription={isEditingDescription}
            editedTitle={editedTitle}
            editedDescription={editedDescription}
            onTitleChange={setEditedTitle}
            onDescriptionChange={setEditedDescription}
            onTitleSave={handleTitleSave}
            onTitleCancel={handleTitleCancel}
            onDescriptionSave={handleDescriptionSave}
            onDescriptionCancel={handleDescriptionCancel}
            onStartEditTitle={() => setIsEditingTitle(true)}
            onStartEditDescription={() => setIsEditingDescription(true)}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
            formError={formError}
          />

          <form
            className={isGridLayout ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}
            onSubmit={onSubmit || ((e: React.FormEvent) => {
              e.preventDefault();
            })}
          >
            <FormFieldsList
              fields={visibleFields}
              selectedFieldId={selectedFieldId}
              rowData={rowData}
              onRowDataChange={onRowDataChange}
              draggedFieldId={draggedFieldId}
              dragOverFieldId={dragOverFieldId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onDeleteField={onDeleteField}
              appearance={appearance}
              model_id={model_id}
              row_id={row_id}
              onEdit={onEdit}
              isReadOnly={isReadOnly}
              isGridLayout={isGridLayout}
            />

            <FormActions
              onSubmit={onSubmit}
              onClear={onClear}
              primaryColor={appearance.primaryColor}
            />
          </form>
        </div>

        {!appearance.hideNocoBranding && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">Powered by SereniBase</p>
          </div>
        )}
      </div>
    </div>
  );
};
