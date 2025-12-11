import React, { useState, useRef, useEffect } from 'react';
import { FormField } from '../../../../types/form';
import { getFieldTypeIconWithMargin, FIELD_TYPES } from '../../../../types/fieldTypes';
import AdvancedDropdown from '../../../../components/common/dropdown/AdvancedDropdown';
import { MultiLineText, SingleLineText, LongText, Number, Decimal, Currency, DateField, DateTime, Time, Year, Email, URL, Duration, User, JSONField } from '../../../../components/common/Fields';
import { ChevronDown, Trash2, Plus, Check, Star, Heart, ThumbsUp, ThumbsDown, Flag, Circle, CheckCircle, BadgeCheck, ShieldCheck, Award, Trophy, Medal, Zap, Sparkles, Crown, Gem, Diamond, CheckSquare, Square } from 'lucide-react';
import { 
  ratingColorOptions, precisionOptions,
  currencyOptions,
  progressColorOptions,
  durationFormatOptions,
  dateFormatOptions,
  timeFormatOptions,
  buttonStyleOptions,
  buttonActionOptions,
  linkTextOptions,
  sourceTableOptions,
  displayFieldOptions,
} from '../../../../types/constants';

interface FieldEditorProps {
  field: FormField;
  fields: FormField[];
  onFieldUpdate: (updates: Partial<FormField>) => void;
}

const FIELD_TYPE_OPTIONS = FIELD_TYPES.map(fieldType => ({
  value: fieldType.key,
  label: fieldType.label
}));

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, fields, onFieldUpdate }) => {
  const [nameError, setNameError] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState(field.title || field.name || '');
  const [description, setDescription] = useState(field.description || '');
  const [fieldType, setFieldType] = useState(field.uidt || field.type || 'text');
  const [config, setConfig] = useState(field.meta || field.config || {});
  const [originalDescription, setOriginalDescription] = useState(field.description || '');
  
  // All configuration states from NewColumnModal
  const [defaultValue, setDefaultValue] = useState('');
  const [richText, setRichText] = useState(false);
  const [showThousands, setShowThousands] = useState(false);
  const [precision, setPrecision] = useState<string | number>('1.0');
  
  // Checkbox config
  const [checkboxIcon, setCheckboxIcon] = useState('check');
  const [checkboxColor, setCheckboxColor] = useState('green');
  const [checkboxDefault, setCheckboxDefault] = useState(false);
  
  // Select/multiselect config
  const [selectOptions, setSelectOptions] = useState<{ option: string; color: string }[]>([]);
  const [newOption, setNewOption] = useState('');
  const [multiDefault, setMultiDefault] = useState<string[]>([]);
  const [singleDefault, setSingleDefault] = useState('');
  
  // Date/time config
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [dateDefault, setDateDefault] = useState('');
  const [showDateDefault, setShowDateDefault] = useState(false);
  const [yearDefault, setYearDefault] = useState<number | null>(null);
  const [showYearDefault, setShowYearDefault] = useState(false);
  const [timeFormat, setTimeFormat] = useState('HH:mm');
  const [timeDefault, setTimeDefault] = useState('');
  const [hourFormat, setHourFormat] = useState<'12' | '24'>('24');
  const [displayTimeZone, setDisplayTimeZone] = useState(false);
  const [sameTimezone, setSameTimezone] = useState(false);
  const [dateTimeDefault, setDateTimeDefault] = useState('');
  const [showDateTimeDefault, setShowDateTimeDefault] = useState(false);
  const [showTimeDefault, setShowTimeDefault] = useState(false);
  
  // Validation config
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneDefault, setPhoneDefault] = useState('');
  const [showPhoneDefault, setShowPhoneDefault] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [emailDefault, setEmailDefault] = useState('');
  const [showEmailDefault, setShowEmailDefault] = useState(false);
  const [urlValid, setUrlValid] = useState(false);
  const [urlDefault, setUrlDefault] = useState('');
  const [showUrlDefault, setShowUrlDefault] = useState(false);
  const [showUrlIcon, setShowUrlIcon] = useState(true);
  
  // Percent and duration config
  const [displayAsProgress, setDisplayAsProgress] = useState(false);
  const [progressColor, setProgressColor] = useState('blue');
  const [showPercentDefault, setShowPercentDefault] = useState(false);
  const [percentDefault, setPercentDefault] = useState(0);
  const [durationFormat, setDurationFormat] = useState('h:mm');
  const [showDurationDefault, setShowDurationDefault] = useState(false);
  const [durationDefault, setDurationDefault] = useState(0);
  
  // Rating config
  const [ratingIcon, setRatingIcon] = useState('star');
  const [ratingColor, setRatingColor] = useState('yellow');
  const [ratingMax, setRatingMax] = useState(5);
  const [ratingDefault, setRatingDefault] = useState(0);
  const [showRatingDefault, setShowRatingDefault] = useState(false);
  
  // Currency config
  const [currencyType, setCurrencyType] = useState('USD');
  const [showCurrencyDefault, setShowCurrencyDefault] = useState(false);
  const [currencyDefault, setCurrencyDefault] = useState<any>(null);
  
  // User config
  const [allowMultipleUsers, setAllowMultipleUsers] = useState(false);
  const [showUserDefault, setShowUserDefault] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string | string[] | null>(null);
  
  // JSON config
  const [prettyPrintJson, setPrettyPrintJson] = useState(true);
  const [collapsibleJson, setCollapsibleJson] = useState(true);
  const [showJsonDefault, setShowJsonDefault] = useState(false);
  
  // UI state
  const [showDescription, setShowDescription] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showRatingIconDropdown, setShowRatingIconDropdown] = useState(false);
  const [showRatingColorDropdown, setShowRatingColorDropdown] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update state when field changes
  useEffect(() => {
    setFieldName(field.title || field.name || '');
    const desc = field.description || '';
    setDescription(desc);
    setOriginalDescription(desc);
    setFieldType(field.uidt || field.type || 'text');
    setConfig(field.meta || field.config || {});
    
    // Load configuration from field meta/config
    const fieldConfig = field.meta || field.config || {};
    setDefaultValue(String(fieldConfig.defaultValue || ''));
    setRichText(!!fieldConfig.richText);
    setShowThousands(!!fieldConfig.showThousands);
    setPrecision(typeof fieldConfig.precision === 'string' || typeof fieldConfig.precision === 'number' ? fieldConfig.precision : '1.0');
    setCheckboxIcon(String(fieldConfig.checkboxIcon || 'check'));
    setCheckboxColor(String(fieldConfig.checkboxColor || 'green'));
    setCheckboxDefault(!!fieldConfig.checkboxDefault);
    setSelectOptions(
      Array.isArray(fieldConfig.options)
        ? fieldConfig.options.map((o: any) => (typeof o === 'string' ? { option: o, color: '#000000' } : { option: o.option, color: o.color || '#000000' }))
        : Array.isArray(fieldConfig.selectOptions)
          ? fieldConfig.selectOptions.map((o: any) => (typeof o === 'string' ? { option: o, color: '#000000' } : { option: o.option, color: o.color || '#000000' }))
          : []
    );
    setMultiDefault(Array.isArray(fieldConfig.multiDefault) ? fieldConfig.multiDefault : []);
    setSingleDefault(String(fieldConfig.singleDefault || ''));
    setRatingIcon(String(fieldConfig.ratingIcon || 'star'));
    setRatingColor(String(fieldConfig.ratingColor || 'yellow'));
    setRatingMax(typeof fieldConfig.ratingMax === 'number' ? fieldConfig.ratingMax : 5);
    setRatingDefault(typeof fieldConfig.ratingDefault === 'number' ? fieldConfig.ratingDefault : 0);
    setDateFormat(String(fieldConfig.dateFormat || 'YYYY-MM-DD'));
    setTimeFormat(String(fieldConfig.timeFormat || 'HH:mm'));
    setHourFormat((fieldConfig.hourFormat === '12' || fieldConfig.hourFormat === '24') ? fieldConfig.hourFormat : '24');
    setDisplayTimeZone(!!fieldConfig.displayTimeZone);
    setSameTimezone(!!fieldConfig.sameTimezone);
    setDateTimeDefault(String(fieldConfig.dateTimeDefault || ''));
    setYearDefault(typeof fieldConfig.yearDefault === 'number' ? fieldConfig.yearDefault : null);
    setDateDefault(String(fieldConfig.dateDefault || ''));
    setTimeDefault(String(fieldConfig.timeDefault || ''));
    setPhoneValid(!!fieldConfig.phoneValid);
    setPhoneDefault(String(fieldConfig.phoneDefault || ''));
    setEmailValid(!!fieldConfig.emailValid);
    setEmailDefault(String(fieldConfig.emailDefault || ''));
    setUrlValid(!!fieldConfig.urlValid);
    setUrlDefault(String(fieldConfig.urlDefault || ''));
    setShowUrlIcon(fieldConfig.showUrlIcon !== false);
    setDisplayAsProgress(!!fieldConfig.displayAsProgress);
    setPercentDefault(typeof fieldConfig.percentDefault === 'number' ? fieldConfig.percentDefault : 0);
    setDurationFormat(String(fieldConfig.durationFormat || 'h:mm'));
    setDurationDefault(typeof fieldConfig.durationDefault === 'number' ? fieldConfig.durationDefault : 0);
    setCurrencyType(String(fieldConfig.currencyType || 'USD'));
    setCurrencyDefault(fieldConfig.currencyDefault || null);
    setAllowMultipleUsers(!!fieldConfig.allowMultiple);
    setSelectedUsers((fieldConfig.defaultValue as string | string[] | null) || null);
    setPrettyPrintJson(fieldConfig.prettyPrint !== false);
    setCollapsibleJson(fieldConfig.collapsible !== false);
  }, [field.id]);

  // Debounced duplicate name check
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const trimmed = fieldName.trim().toLowerCase();
      if (
        trimmed &&
        fields.some(f => f.id !== field.id && (f.title || f.name || '').toLowerCase() === trimmed)
      ) {
        setNameError('Field name already exists');
      } else {
        setNameError(null);
      }
    }, 400);
    
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [fieldName, fields, field.id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldName(e.target.value);
  };

  const handleNameBlur = () => {
    if (!nameError && fieldName.trim() && fieldName !== (field.title || field.name)) {
      onFieldUpdate({ 
        title: fieldName.trim(), 
        name: fieldName.trim(),
        column_name: fieldName.trim()
      });
    }
  };

  const handleTypeChange = (newType: string | string[]) => {
    const typeValue = Array.isArray(newType) ? newType[0] : newType;
    setFieldType(typeValue);
    // When type changes, preserve existing config if available, otherwise use empty
    // The config will be updated separately via handleConfigChange when user configures the new type
    onFieldUpdate({ 
      uidt: typeValue,
      type: typeValue,
      meta: config || {} // Preserve existing config structure, will be updated via handleConfigChange
    });
  };

  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
    onFieldUpdate({ meta: newConfig });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleDescriptionBlur = (value: string) => {
    if (value !== originalDescription) {
      setOriginalDescription(value);
      onFieldUpdate({ description: value });
    }
  };

  // Update configuration when any config value changes
  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onFieldUpdate({ meta: newConfig });
  };

  // Handle dropdown clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (showIconDropdown && !target.closest('.icon-dropdown')) {
        setShowIconDropdown(false);
      }
      if (showColorDropdown && !target.closest('.color-dropdown')) {
        setShowColorDropdown(false);
      }
      if (showRatingIconDropdown && !target.closest('.rating-icon-dropdown')) {
        setShowRatingIconDropdown(false);
      }
      if (showRatingColorDropdown && !target.closest('.rating-color-dropdown')) {
        setShowRatingColorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIconDropdown, showColorDropdown, showRatingIconDropdown, showRatingColorDropdown]);



  const selectedFieldType = FIELD_TYPES.find(ft => ft.key === fieldType);
  const isSystemField = field.system || field.isSystem;

  // Render configuration based on field type
  const renderFieldConfiguration = () => {
    switch (fieldType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="richText" 
                checked={richText} 
                onChange={(e) => {
                  setRichText(e.target.checked);
                  updateConfig({ richText: e.target.checked });
                }}
                className="rounded"
              />
              <label htmlFor="richText" className="text-sm text-gray-600">Enable rich text</label>
            </div>
            <div>
              <button 
                className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-800 mb-2"
                onClick={() => setShowDescription(!showDescription)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showDescription && (
                <SingleLineText
                  value={defaultValue}
                  onChange={(value) => {
                    setDefaultValue(value);
                    updateConfig({ defaultValue: value });
                  }}
                  placeholder="Enter default text"
                  isBorder={true}
                />
              )}
            </div>
          </div>
        );

      case 'longText':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="richText" 
                checked={richText} 
                onChange={(e) => {
                  setRichText(e.target.checked);
                  updateConfig({ richText: e.target.checked });
                }}
                className="rounded"
              />
              <label htmlFor="richText" className="text-sm text-gray-600">Enable rich text</label>
            </div>
            <div>
              <button 
                className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-800 mb-2"
                onClick={() => setShowDescription(!showDescription)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showDescription && (
                <LongText
                  value={defaultValue}
                  onChange={(value) => {
                    setDefaultValue(value);
                    updateConfig({ defaultValue: value });
                  }}
                  placeholder="Enter default text value"
                  minRows={4}
                  isBorder={true}
                />
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showThousands" 
                checked={showThousands} 
                onChange={(e) => {
                  setShowThousands(e.target.checked);
                  updateConfig({ showThousands: e.target.checked });
                }}
                className="rounded"
              />
              <label htmlFor="showThousands" className="text-sm text-gray-600">Show thousands separator</label>
            </div>
            <div>
              <button 
                className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-800 mb-2"
                onClick={() => setShowDescription(!showDescription)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showDescription && (
                <Number
                  value={defaultValue}
                  onChange={(value) => {
                    setDefaultValue(value?.toString() || '');
                    updateConfig({ defaultValue: value });
                  }}
                  config={{ showThousands }}
                  isBorder={true}
                />
              )}
            </div>
          </div>
        );

      case 'decimal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precision</label>
              <AdvancedDropdown
                options={precisionOptions}
                value={precision}
                onChange={(val) => {
                  setPrecision(val as string);
                  updateConfig({ precision: val });
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showThousands" 
                checked={showThousands} 
                onChange={(e) => {
                  setShowThousands(e.target.checked);
                  updateConfig({ showThousands: e.target.checked });
                }}
                className="rounded"
              />
              <label htmlFor="showThousands" className="text-sm text-gray-600">Show thousands separator</label>
            </div>
            <div>
              <button 
                className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-800 mb-2"
                onClick={() => setShowDescription(!showDescription)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showDescription && (
                <Decimal
                  value={parseInt(defaultValue)}
                  onChange={(value) => {
                    setDefaultValue(value?.toString() || '');
                    updateConfig({ defaultValue: value });
                  }}
                  showThousands={showThousands}
                  config={{ precision: typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision }}
                  isBorder={true}
                  allowEdit={false}
                />
              )}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Icon</div>
                <div className="relative icon-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    onClick={() => setShowIconDropdown(!showIconDropdown)}
                  >
                    <div className="flex items-center gap-2">
                      {checkboxIcon === 'check' && <CheckSquare className="w-4 h-4 text-green-600 fill-current" />}
                      {checkboxIcon === 'circle' && <CheckCircle className="w-4 h-4 text-green-600 fill-current" />}
                      {checkboxIcon === 'star' && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      <span className="capitalize">{checkboxIcon}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showIconDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-700 border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {[
                        { key: 'check', label: 'Check', icon: <CheckSquare className="w-4 h-4 text-green-600 fill-current" /> },
                        { key: 'circle', label: 'Circle', icon: <CheckCircle className="w-4 h-4 text-green-600 fill-current" /> },
                        { key: 'star', label: 'Star', icon: <Star className="w-4 h-4 text-yellow-500 fill-current" /> },
                        { key: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4 text-red-500 fill-current" /> },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 ${checkboxIcon === option.key ? 'bg-blue-100 font-bold' : ''}`}
                          onClick={() => {
                            setCheckboxIcon(option.key);
                            updateConfig({ checkboxIcon: option.key });
                            setShowIconDropdown(false);
                          }}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                          {checkboxIcon === option.key && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Color</div>
                <div className="relative color-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    onClick={() => setShowColorDropdown(!showColorDropdown)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-${checkboxColor}-600`}></div>
                      <span className="capitalize">{checkboxColor}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showColorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-700 border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {[
                        { key: 'green', label: 'Green', color: 'green' },
                        { key: 'blue', label: 'Blue', color: 'blue' },
                        { key: 'red', label: 'Red', color: 'red' },
                        { key: 'purple', label: 'Purple', color: 'purple' },
                      ].map((color) => (
                        <button
                          key={color.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 ${checkboxColor === color.key ? 'bg-blue-100 font-bold' : ''}`}
                          onClick={() => {
                            setCheckboxColor(color.key);
                            updateConfig({ checkboxColor: color.key });
                            setShowColorDropdown(false);
                          }}
                        >
                          <div className={`w-4 h-4 rounded-full bg-${color.color}-600`}></div>
                          <span>{color.label}</span>
                          {checkboxColor === color.key && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Default value</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 border rounded text-sm flex items-center gap-2 ${checkboxDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => {
                    setCheckboxDefault(true);
                    updateConfig({ checkboxDefault: true });
                  }}
                >
                  <CheckSquare className="w-4 h-4 text-green-600 fill-current" />
                  <span>Checked</span>
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 border rounded text-sm flex items-center gap-2 ${!checkboxDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => {
                    setCheckboxDefault(false);
                    updateConfig({ checkboxDefault: false });
                  }}
                >
                  <Square className="w-4 h-4 text-gray-400 border-2 border-gray-300 rounded" />
                  <span>Unchecked</span>
                </button>
              </div>
            </div>
          </div>
        );

      // Add more field types as needed...
      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration options for {fieldType} field type will be available soon.
          </div>
        );
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {selectedFieldType && getFieldTypeIconWithMargin(selectedFieldType.key)}
          <span className="font-medium text-sm text-gray-900">
            {selectedFieldType?.label || 'Unknown Type'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {isSystemField && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>System Field:</strong> This field is managed by the system and cannot be edited.
            </p>
          </div>
        )}

        {/* Field Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Name
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            disabled={isSystemField}
            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
              nameError ? 'border-red-500' : 'border-gray-300'
            } ${isSystemField ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            placeholder="Enter field name"
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-500">{nameError}</p>
          )}
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Type
          </label>
          <AdvancedDropdown
            options={FIELD_TYPE_OPTIONS}
            value={fieldType}
            onChange={handleTypeChange}
            placeholder="Select field type"
            disabled={isSystemField}
          />
        </div>

        {/* Field Configuration */}
        {!isSystemField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration
            </label>
            {renderFieldConfiguration()}
            
            {/* Description field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <MultiLineText
                value={description}
                onChange={(value) => {
                  handleDescriptionChange(value);
                  handleDescriptionBlur(value);
                }}
                placeholder="Enter field description..."
                rows={2}
                isBorder={true}
              />
            </div>

            {/* Required field toggle */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean((config as any)?.required)}
                  onChange={(e) => updateConfig({ required: e.target.checked })}
                  className="rounded"
                />
                Required field
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};