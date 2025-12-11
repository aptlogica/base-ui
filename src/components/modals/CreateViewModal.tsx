import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertCircle } from 'lucide-react';
import { VIEW_ICONS, ViewType } from '../../types/viewTypes';
import { MultiLineText } from '../common/Fields/MultiLineText';
import AdvancedDropdown from '../common/dropdown/AdvancedDropdown';
import { getFieldTypeIconComponent } from '../../types/fieldTypes';
import { useTable } from '../../hooks/useApi';
import { validateViewName, getDefaultViewName, generateUniqueName } from '../../utils/nameValidation';

interface CreateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; type: string; fieldId?: string; startDateFieldId?: string; endDateFieldId?: string }) => void;
  tableId: string;
  viewType: string;
  defaultName?: string;
  fields: any[];
  existingViews?: any[];
}

export const CreateViewModal: React.FC<CreateViewModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  tableId,
  viewType,
  defaultName = '',
  fields = [],
  existingViews = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedField, setSelectedField] = useState<any | null>(null);
  const [validationError, setValidationError] = useState('');
  const [fieldError, setFieldError] = useState('');
  // Gantt chart specific fields
  const [startDateField, setStartDateField] = useState<any | null>(null);
  const [endDateField, setEndDateField] = useState<any | null>(null);

  // Decide effective fields: prefer provided `fields` prop, else fetch table columns
  const tableQuery = useTable(tableId);
  const fetchedColumns = tableQuery?.data?.data?.columns || tableQuery?.data?.data?.fields || tableQuery?.data?.data?.model?.columns || [];
  const effectiveFieldsSource = (fields && fields.length > 0) ? fields : fetchedColumns;

  // Normalize incoming fields and ensure we check both 'uidt' and 'type'
  const normalizedFields = (effectiveFieldsSource || []).map((f: any) => ({
    ...f,
    uidt: f?.uidt || f?.type,
    name: f?.title || f?.column_name || f?.name || String(f?.id || ''),
  }));

  let filteredFields = normalizedFields;
  let showFieldDropdown = false;

  // Helper to test if a field is a date/datetime field (excludes user audit fields like createdBy)
  const isDateField = (f: any) => {
    const u = String((f?.uidt || f?.type || '')).toLowerCase();
    // Only include actual date/time fields, exclude user audit fields (createdBy, lastModifiedBy)
    return (
      u === 'date' ||
      u === 'datetime' ||
      u === 'time' ||
      u === 'createdtime' ||
      u === 'lastmodifiedtime' ||
      u === 'year'
    );
  };

  switch (viewType) {
    case 'calendar':
      // Only include actual date/datetime fields, exclude user audit fields
      filteredFields = normalizedFields.filter((f: any) => isDateField(f));
      showFieldDropdown = true;

      // If no user-visible date-like fields exist, add system fallbacks so the dropdown is never empty
      if (filteredFields.length === 0) {
        filteredFields = [
          { id: 'created_at', uidt: 'datetime', name: 'Created at', description: 'System created timestamp', system: true },
          { id: 'updated_at', uidt: 'datetime', name: 'Updated at', description: 'System updated timestamp', system: true },
        ];
      }
      break;
    case 'kanban':
      filteredFields = normalizedFields.filter((f: any) => String((f.uidt || f.type || '')).toLowerCase() === 'select');
      showFieldDropdown = true;
      break;
    case 'gallery':
      // Filter for attachment fields for image selection
      filteredFields = normalizedFields.filter((f: any) =>
        String((f.uidt || f.type || '')).toLowerCase() === 'attachment'
      );
      showFieldDropdown = true;
      break;
    case 'ganttChart':
      // Filter for date fields only (exclude datetime and timestamp) for both start and end date selection
      filteredFields = normalizedFields.filter((f: any) => String((f?.uidt || f?.type || '')).toLowerCase() === 'date');
      showFieldDropdown = true;

      // If no date fields exist, add system fallbacks
      if (filteredFields.length === 0) {
        filteredFields = [
          { id: 'created_at', uidt: 'date', name: 'Created at', description: 'System created date', system: true },
          { id: 'updated_at', uidt: 'date', name: 'Updated at', description: 'System updated date', system: true },
        ];
      }
      break;
    default:
      filteredFields = normalizedFields;
      showFieldDropdown = false;
  }

  useEffect(() => {
    if (isOpen) {
      // Automatically set the default view name (which will be incremented if duplicates exist)
      let initialName = '';
      if (defaultName && defaultName.trim()) {
        // If defaultName is provided, make it unique if it's a duplicate
        initialName = generateUniqueName(defaultName.trim(), existingViews, 'view');
      } else {
        // Otherwise, generate the default view name based on type
        initialName = getDefaultViewName(viewType, existingViews);
      }
      setName(initialName);
      setDescription('');
      setError('');
      setValidationError('');
      setFieldError('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultName, viewType, existingViews]);

  // Validate name on change
  useEffect(() => {
    if (name.trim()) {
      const validation = validateViewName(name, existingViews);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingViews]);

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedField(null);
      setStartDateField(null);
      setEndDateField(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, viewType]);

  // Validate Gantt chart date fields in real-time
  useEffect(() => {
    if (viewType === 'ganttChart' && startDateField && endDateField) {
      const startFieldId = (startDateField && typeof startDateField === 'object') ? (startDateField as any).value : (startDateField as any);
      const endFieldId = (endDateField && typeof endDateField === 'object') ? (endDateField as any).value : (endDateField as any);

      if (startFieldId === endFieldId) {
        setFieldError('Start date and end date fields must be different');
      } else {
        setFieldError('');
      }
    }
  }, [startDateField, endDateField, viewType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If no name provided, generate a default name
    let finalName = name.trim();
    if (!finalName) {
      finalName = getDefaultViewName(viewType, existingViews);
    }

    // Check validation
    const validation = validateViewName(finalName, existingViews);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid view name');
      return;
    }

    // Clear previous errors
    setError('');
    setFieldError('');

    // Validation for field selection based on view type
    if (showFieldDropdown) {
      if (viewType === 'ganttChart') {
        if (!startDateField) {
          setFieldError('Start date field is required for Gantt charts');
          return;
        }
        if (!endDateField) {
          setFieldError('End date field is required for Gantt charts');
          return;
        }
        // Check if start and end date fields are the same
        const startFieldId = (startDateField && typeof startDateField === 'object') ? (startDateField as any).value : (startDateField as any);
        const endFieldId = (endDateField && typeof endDateField === 'object') ? (endDateField as any).value : (endDateField as any);
        if (startFieldId === endFieldId) {
          setFieldError('Start date and end date fields must be different');
          return;
        }
      } else {
        // For other view types that require field selection
        if (!selectedField) {
          setFieldError(`${viewType === 'calendar' ? 'Date field' : viewType === 'kanban' ? 'Group by field' : 'Field'} is required for ${viewType} views`);
          return;
        }
      }
    }

    // Additional validation: Check if fields are available for the view type
    if (showFieldDropdown && filteredFields.length === 0) {
      setFieldError(`No suitable fields available for ${viewType} view. Please add the required field type to your table first.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (viewType === 'ganttChart') {
        // For Gantt charts, pass both start and end date field IDs
        const startDateFieldId = (startDateField && typeof startDateField === 'object') ? (startDateField as any).value : (startDateField as any);
        const endDateFieldId = (endDateField && typeof endDateField === 'object') ? (endDateField as any).value : (endDateField as any);

        await onCreate({
          name: finalName,
          description: description.trim(),
          type: viewType,
          startDateFieldId,
          endDateFieldId,
        });
      } else {
        // For other view types, use the single field selection
        const normalizedFieldId = (selectedField && typeof selectedField === 'object') ? (selectedField as any).value : (selectedField as any);
        await onCreate({
          name: finalName,
          description: description.trim(),
          type: viewType,
          fieldId: normalizedFieldId,
        });
      }

      // Close the modal on successful creation
      onClose();
    } catch (err) {
      setError('Failed to create view. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const viewConfig = VIEW_ICONS[viewType as keyof typeof VIEW_ICONS] || VIEW_ICONS.grid;
  const IconComponent = viewConfig.icon;

  if (!isOpen) return null;


  // Prepare dropdown options just before render
  const fieldDropdownOptions = filteredFields.map((f: any) => ({
    value: f.id,
    label: f.name,
    icon: getFieldTypeIconComponent(f.uidt || f.type) || <span className="w-4 h-4 text-gray-400" />,
    description: f.description || '',
    type: f.uidt || f.type,
    raw: f,
  }));


  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 icon-primary rounded-lg flex items-center justify-center`}>
              <IconComponent size={20} className="icon-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Create {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
              </h2>
              <p className="text-sm text-secondary">Add a new view to your table</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-1">
            <label htmlFor="viewName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              View Name <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="viewName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter view name"
                className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border-gray-300'
                  }`}
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${validationError ? 'text-red-500' : (name.trim().length === 0 || name.trim().length >= 3) ? 'text-green-600' : 'text-gray-400'
                    } cursor-help`} />
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-card border rounded-lg shadow-lg p-3 text-sm z-50">
                    <h4 className="mb-2 text-primary">View name info:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Optional - leave empty for auto-generated name</li>
                      <li className={`${name.trim().length >= 3 || name.trim().length === 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        • If provided, minimum 3 characters
                      </li>
                      <li>• Default: "{viewType.charAt(0).toUpperCase() + viewType.slice(1)} View"</li>
                    </ul>
                  </div>
                </span>
              </div>

            </div>
            {/* Validation Error */}
            {(error || validationError) && (
              <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError || error}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/50 characters
            </p>
          </div>

          {/* Field Selection for different view types */}
          {showFieldDropdown && (
            fieldDropdownOptions.length > 0 ? (
              viewType === 'ganttChart' ? (
                // Gantt Chart: Dual field selection for start and end dates
                <div className="space-y-4">
                  <AdvancedDropdown
                    label="Start Date Field"
                    options={fieldDropdownOptions}
                    value={startDateField}
                    onChange={(val) => {
                      setStartDateField(val as any);
                    }}
                    placeholder="Select start date field..."
                    searchable
                    required
                  />
                  <AdvancedDropdown
                    label="End Date Field"
                    options={fieldDropdownOptions}
                    value={endDateField}
                    onChange={(val) => {
                      setEndDateField(val as any);
                    }}
                    placeholder="Select end date field..."
                    searchable
                    required
                  />
                </div>
              ) : (
                // Other view types: Single field selection
                <AdvancedDropdown
                  label={viewType === 'calendar' ? 'Date Field' : viewType === 'kanban' ? 'Group by Field' : 'Organize by'}
                  options={fieldDropdownOptions}
                  value={selectedField}
                  onChange={(val) => {
                    setSelectedField(val as any);
                    setFieldError(''); // Clear error when user makes selection
                  }}
                  placeholder="Select field..."
                  searchable
                  required
                />
              )
            ) : (
              // Show a small loading / empty state while fetching columns
              tableQuery.isLoading ? (
                <div className="text-sm text-secondary px-2 py-2">Loading fields...</div>
              ) : (
                <div className="text-sm text-red-500 px-2 py-2">No required fields are available for this view.</div>
              )
            )
          )}

          {/* Field Error Display */}
          {fieldError && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fieldError}</span>
            </div>
          )}

          <MultiLineText
            label="Description"
            value={description}
            onChange={value => setDescription(value)}
            placeholder="Enter view description"
            rows={5}
            isBorder={true}
          />

          {/* View Type Info */}
          <div className="bg-[var(--color-utility-bg)] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <IconComponent size={24} className='icon-primary p-1.5 rounded-lg bg-primary/10' />
              <span className="text-sm font-medium text-primary">
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
              </span>
            </div>
            <p className="text-xs text-secondary">
              {viewType === ViewType.Grid && 'Display data in a spreadsheet-like grid with sorting and filtering.'}
              {viewType === ViewType.Form && 'Create forms for data entry with customizable fields and layouts.'}
              {viewType === ViewType.Gallery && 'Show data as cards with images and rich content.'}
              {viewType === ViewType.Kanban && 'Organize data in columns for project management workflows.'}
              {viewType === ViewType.Calendar && 'Display data in a calendar format with date-based views.'}
              {viewType === ViewType.GanttChart && 'Show project timelines and dependencies in a Gantt chart.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-[var(--text-color-tertiary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (name.trim() && name.trim().length < 3) ||
                !!validationError ||
                !!fieldError ||
                (showFieldDropdown && (fieldDropdownOptions.length === 0 ||
                  (viewType === 'ganttChart' ? (
                    !startDateField ||
                    !endDateField ||
                    startDateField === endDateField
                  ) : !selectedField)))
              }
              className="px-6 py-2 rounded-lg btn-primary text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create View'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 