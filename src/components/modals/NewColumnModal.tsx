import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Search, X, Square, Check, Star, Heart, ThumbsUp, ThumbsDown, Flag, Circle, CheckCircle, BadgeCheck, ShieldCheck, Award, Trophy, Medal, Zap, Sparkles, Crown, Gem, Diamond, Trash2, ChevronDown, ChevronUp, Info, Loader2,
} from 'lucide-react';

import Dropdown from '../../plugins/GridViewPlugin/components/shared/DropDown/DropDown';
import { useClickOutside } from '../../hooks/useClickOutside';
import { FIELD_TYPES } from '../../types/fieldTypes';
import { DateField, DateTime, Duration, Email, JSONField, Time, URL, Year, User, SingleLineText, LongText, Number, Decimal, Currency, MultiLineText, Formula } from '../../components/common/Fields';
import { convertDateFormat } from '../../utils/helpers';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import {
  ratingColorOptions, precisionOptions,
  currencyOptions,
  currencyLocaleOptions,
  progressColorOptions,
  durationFormatOptions,
  dateFormatOptions,
  timeFormatOptions,
  buttonStyleOptions,
  buttonActionOptions,
  timeZoneOptions,
} from '../../types/constants';
import { FieldTypeDropdown } from '../common/dropdown/fieldDropdown/FieldTypeDropdown';
import { useBaseTables, useTable, useAllViews } from '../../hooks/useApi';
import { useNavigationStore } from '../../stores/navigationStore';
import { useToast } from '../../components/common/Toast';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../utils/fieldUsageUtils';

interface FieldType {
  key: string;
  label: string;
  icon: any;
}

interface NewColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (col: any) => void;
  initialValues?: any;
  fields?: any[];
  isAddNewColumn?: boolean;
  isAddNewField?: boolean;
  excludeRefs?: React.RefObject<HTMLElement | null>[];
  currentTableId?: string; // Add current table ID to exclude from target selection
}

export function NewColumnModal({ isOpen, onClose, onSave, initialValues, fields = [], isAddNewColumn = false, isAddNewField = false, excludeRefs = [], currentTableId }: NewColumnModalProps) {
  const [step, setStep] = useState<number | null>(initialValues ? 2 : 1);
  const [fieldName, setFieldName] = useState(initialValues?.title || '');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType | null>(
    initialValues ? FIELD_TYPES.find(type => type.key === initialValues.type) || null : null
  );

  const toast = useToast();
  // Get current base ID and tables for relations
  const { selectedBaseId } = useNavigationStore();
  const { data: tablesResponse } = useBaseTables(selectedBaseId || '');
  // Get all views for field usage validation (fallback)
  const { data: allViews = [] } = useAllViews();

  // Get fresh table data with views (preferred source)
  const { data: tableDataResponse } = useTable(currentTableId || '');

  // Prefer tableData.views (fresh) over allViews (cached)
  // Filter views to only include views from the current table
  const currentTableViews = useMemo(() => {
    // First try to use fresh views from tableData
    if (currentTableId && tableDataResponse?.data?.views && Array.isArray(tableDataResponse.data.views)) {
      return tableDataResponse.data.views;
    }

    // Fallback to filtered allViews
    if (currentTableId && allViews && allViews.length > 0) {
      const filtered = allViews.filter((view: any) =>
      String(view.model_id || view.modelId || '') === String(currentTableId)
    );
      return filtered;
    }

    return [];
  }, [tableDataResponse, allViews, currentTableId]);

  // Check if field is used in views (for disabling type change)
  const isFieldUsedInViews = useMemo(() => {
    if (!initialValues?.id || !currentTableViews || currentTableViews.length === 0) {
      return false;
    }

    // First check if it's used as a CRITICAL field in kanban, gantt, gallery, or calendar
    // Use currentTableViews (which prefers tableData.views) instead of allViews
    const criticalFieldUsage = checkCriticalFieldUsageInViews(initialValues.id, currentTableViews, currentTableId);
    if (criticalFieldUsage.isUsedInViews) {
      return true; // Block type change if used as critical field
    }

    // Then check general field usage
    const fieldUsage = checkFieldUsageInViews(initialValues.id, currentTableViews);
    return fieldUsage.isUsedInViews;
  }, [initialValues?.id, currentTableViews, currentTableId]);

  // Extract tables array from response and filter out current table
  const tables = useMemo(() => {
    if (!tablesResponse?.data || !Array.isArray(tablesResponse.data)) return [];
    // Extract model objects from the response structure and filter out current table
    return tablesResponse.data
      .map(item => item.model)
      .filter(Boolean)
      .filter(table => table.id !== currentTableId); // Exclude current table from target selection
  }, [tablesResponse, currentTableId]);

  // Config state for each type
  const [defaultValue, setDefaultValue] = useState('');
  const [description, setDescription] = useState('');
  const [richText, setRichText] = useState(false);
  const [showThousands, setShowThousands] = useState(false);
  const [precision, setPrecision] = useState<string | number>('1.0');


  // Add state for checkbox config
  const [checkboxIcon, setCheckboxIcon] = useState('check');
  const [checkboxColor, setCheckboxColor] = useState('green');
  const [checkboxDefault, setCheckboxDefault] = useState(false);

  // Add state for select/multiselect config
  // const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [selectOptions, setSelectOptions] = useState<{ option: string; color: string }[]>([]);
  const [color, setColor] = useState<string>('');
  const [newOption, setNewOption] = useState('');
  const [multiDefault, setMultiDefault] = useState<string[]>([]);
  const [singleDefault, setSingleDefault] = useState('');

  // Add state for date, year, time, phone, email, url configs
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [dateDefault, setDateDefault] = useState('');
  const [showDateDefault, setShowDateDefault] = useState(false);
  const [yearDefault, setYearDefault] = useState<number | null>(null);
  const [showYearDefault, setShowYearDefault] = useState(false);
  const [timeFormat, setTimeFormat] = useState('hh:mm');
  const [timeDefault, setTimeDefault] = useState('');
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

  // Add state for percent and duration configs
  const [displayAsProgress, setDisplayAsProgress] = useState(false);
  const [progressColor, setProgressColor] = useState('blue');
  const [showPercentDefault, setShowPercentDefault] = useState(false);
  const [percentDefault, setPercentDefault] = useState<number | null>(null);
  const [durationFormat, setDurationFormat] = useState('h:mm');
  const [showDurationDefault, setShowDurationDefault] = useState(false);
  const [durationDefault, setDurationDefault] = useState(0);

  // Add at the top level, with other useState hooks
  const [ratingIcon, setRatingIcon] = useState('star');
  const [ratingColor, setRatingColor] = useState('yellow');
  const [ratingMax, setRatingMax] = useState(5);
  const [ratingDefault, setRatingDefault] = useState(0);
  const [showRatingDefault, setShowRatingDefault] = useState(false);
  const [ratingDefaultHover, setRatingDefaultHover] = useState<number | null>(null);

  const [hourFormat, setHourFormat] = useState<'12' | '24'>('12');
  const [displayTimeZone, setDisplayTimeZone] = useState(false);
  const [sameTimezone, setSameTimezone] = useState(false);
  const [timeZone, setTimeZone] = useState<string>('');
  const [dateTimeDefault, setDateTimeDefault] = useState('');
  const [showDateTimeDefault, setShowDateTimeDefault] = useState(false);

  // Add state for time field config
  const [showTimeDefault, setShowTimeDefault] = useState(false);

  // Add state for currency config
  const [currencyType, setCurrencyType] = useState('USD');
  const [currencyLocale, setCurrencyLocale] = useState('en-US');
  const [showCurrencyDefault, setShowCurrencyDefault] = useState(false);
  const [currencyDefault, setCurrencyDefault] = useState<number | null>(null);

  // Add state for text config
  const [showTextDefault, setShowTextDefault] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showThousandsToggle, setShowThousandsToggle] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showRatingIconDropdown, setShowRatingIconDropdown] = useState(false);
  const [showRatingColorDropdown, setShowRatingColorDropdown] = useState(false);

  // Add state for json field config
  const [showJsonDefault, setShowJsonDefault] = useState(false);

  // Add click outside handlers for dropdowns
  useEffect(() => {
    // Initialize configuration values when in edit mode
    if (initialValues) {
      setDescription(initialValues.description || '');
      if (initialValues.config) {
        switch (initialValues.type) {
          case 'number':
          case 'decimal':
            setShowThousands(initialValues.config.showThousands || false);
            setPrecision(initialValues.config.precision || '1.0');
            break;
          case 'text':
            setRichText(initialValues.config.richText || false);
            break;
          case 'select':
          case 'multiSelect':
            setSelectOptions(initialValues.config.options || []);
            if (initialValues.type === 'select') {
              setSingleDefault(initialValues.config.defaultValue || '');
            } else {
              setMultiDefault(initialValues.config.defaultValue || []);
            }
            break;
          case 'boolean':
            // Boolean/checkbox fields: check both saved format (icon/color/defaultValue) and state format (checkboxIcon/checkboxColor/checkboxDefault)
            setCheckboxIcon(initialValues.config.checkboxIcon || initialValues.config.icon || 'check');
            setCheckboxColor(initialValues.config.checkboxColor || initialValues.config.color || 'green');
            setCheckboxDefault(initialValues.config.checkboxDefault !== undefined ? !!initialValues.config.checkboxDefault : (initialValues.config.defaultValue !== undefined ? !!initialValues.config.defaultValue : false));
            break;
          case 'formula':
            setFormulaText(initialValues.config.formula || '');
            setFormulaFormatting(initialValues.config.formatting || {
              type: 'text' as 'number' | 'currency' | 'percent' | 'duration' | 'date' | 'text',
              precision: 2,
              currency: 'USD',
              dateFormat: 'YYYY-MM-DD'
            });
            break;
          // Add more cases for other field types as needed
        }
      }
    }
  }, [initialValues]);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconDropdown, showColorDropdown, showRatingIconDropdown, showRatingColorDropdown]);

  // Add state for user field config
  const [allowMultipleUsers, setAllowMultipleUsers] = useState(false);
  const [showUserDefault, setShowUserDefault] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string | string[] | null>(null);

  // Add state for links field config (table relations)
  const [relationType, setRelationType] = useState<'one-to-one' | 'has-many' | 'many-to-many'>('one-to-one');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<any>(null);

  // Add state for lookup field config
  const [selectedRelationId, setSelectedRelationId] = useState<string>('');
  const [selectedLookupColumnId, setSelectedLookupColumnId] = useState<string>('');
  const [targetTableFields, setTargetTableFields] = useState<any[]>([]);

  // Get all links type fields from current table
  const linkFields = useMemo(() => {
    return (fields || []).filter(field => field.type === 'links' || field.uidt === 'links');
  }, [fields]);

  // Initialize lookup field configuration when linkFields become available
  // Only runs once when modal opens with initialValues
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (initialValues?.type === 'lookup' && isOpen && linkFields.length > 0 && !hasInitializedRef.current) {
      const config = initialValues.meta || initialValues.config || {};
      const relationId = config.relation_id;
      const lookupColumnId = config.lookup_column_id;

      if (relationId) {
        const matchingLinkField = linkFields.find(field => {
          const fieldRelationId = field.meta?.relation_id || field.config?.relation_id;
          return fieldRelationId === relationId;
        });

        if (matchingLinkField) {
          setSelectedRelationId(matchingLinkField.id);
          // Set lookup column ID if available - this will be set after target table loads
          if (lookupColumnId) {
            // Store it to set later when target table fields are available
            setTimeout(() => {
              setSelectedLookupColumnId(lookupColumnId);
            }, 100);
          }
          hasInitializedRef.current = true;
        }
      }
    }

    // Reset initialization flag when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [linkFields, initialValues, isOpen]);

  // Get selected relation field and its target table ID
  const selectedRelation = useMemo(() => {
    if (!selectedRelationId) return null;
    return linkFields.find(field => field.id === selectedRelationId);
  }, [selectedRelationId, linkFields]);

  const targetTableId = selectedRelation?.meta?.relation?.with || selectedRelation?.config?.relation?.with || '';

  // Fetch target table data to get its fields (only if we have a valid table ID)
  const { data: targetTableData, isLoading: isTargetTableLoading } = useTable(targetTableId);

  // Extract fields from target table
  useEffect(() => {
    if (!targetTableId || !targetTableData) {
      setTargetTableFields([]);
      return;
    }

    if (targetTableData?.data?.columns && Array.isArray(targetTableData.data.columns)) {
      // Filter out links, rollup, and lookup fields
      // Exclude system fields BUT keep 'title' as it's important for lookups
      const filteredFields = targetTableData.data.columns.filter((col: any) =>
        col.uidt !== 'links' &&
        col.uidt !== 'rollup' &&
        col.uidt !== 'lookup' &&
        (!col.system || col.uidt === 'text' || col.column_name === 'title')
      );
      setTargetTableFields(filteredFields);

      // If editing a lookup field and we have the lookup column ID, ensure it's set
      if (initialValues?.type === 'lookup' && isOpen) {
        const config = initialValues.meta || initialValues.config || {};
        const lookupColumnId = config.lookup_column_id;
        if (lookupColumnId && !selectedLookupColumnId) {
          // Verify the column exists in the filtered fields
          const columnExists = filteredFields.some((col: any) => col.id === lookupColumnId);
          if (columnExists) {
            setSelectedLookupColumnId(lookupColumnId);
          }
        }
      }
    } else {
      setTargetTableFields([]);
    }
  }, [targetTableData, targetTableId, initialValues, isOpen, selectedLookupColumnId]);

  // Initialize selectedTable when tables are loaded and we have a selectedTableId (for Links fields)
  useEffect(() => {
    if (selectedTableId && Array.isArray(tables) && tables.length > 0 && !selectedTable) {
      const table = tables.find(t => t.id === selectedTableId);
      if (table) {
        setSelectedTable(table);
      }
    }
  }, [tables, selectedTableId, selectedTable]);

  // Track the previous relation ID to detect when it actually changes
  const previousRelationIdRef = useRef<string>('');

  // Reset lookup column ONLY when relation changes (not during initial load or when user changes lookup column)
  useEffect(() => {
    // Skip during initial load when editing (wait for initialization to complete)
    if (initialValues?.type === 'lookup' && isOpen && !hasInitializedRef.current) {
      // Still initializing - don't reset yet
      if (selectedRelationId) {
        previousRelationIdRef.current = selectedRelationId;
      }
      return;
    }

    // Check if relation actually changed (not just set for the first time)
    const relationChanged = previousRelationIdRef.current !== '' &&
      previousRelationIdRef.current !== selectedRelationId;

    if (relationChanged && selectedRelationId) {
      // Relation changed - reset lookup column
      setSelectedLookupColumnId('');
      previousRelationIdRef.current = selectedRelationId;
    } else if (selectedRelationId && previousRelationIdRef.current === '') {
      // First time setting relation (not a change) - just track it
      previousRelationIdRef.current = selectedRelationId;
    }

    // Reset when relation is cleared
    if (!selectedRelationId) {
      setTargetTableFields([]);
      previousRelationIdRef.current = '';
    }
  }, [selectedRelationId, initialValues, isOpen]);

  // Reset ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      previousRelationIdRef.current = '';
    }
  }, [isOpen]);

  // Add state for button field config
  const [buttonStyle, setButtonStyle] = useState('primary');
  const [buttonAction, setButtonAction] = useState('url');
  const [openButtonInNewTab, setOpenButtonInNewTab] = useState(true);

  // Add state for formula field config
  const [formulaText, setFormulaText] = useState('');
  const [formulaFormatting, setFormulaFormatting] = useState({
    type: 'text' as 'number' | 'currency' | 'percent' | 'duration' | 'date' | 'text',
    precision: 2,
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD'
  });

  const [nameError, setNameError] = useState<string | null>(null);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const fieldNameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useClickOutside({
    isOpen,
    onClose,
    excludeRefs: excludeRefs
  });

  //select, multi-select input state - track which option is being edited
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState<string>('');
  const [optionError, setOptionError] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Utility to convert a string to Title Case
  function toTitleCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // Utility to generate a unique column name by appending/incrementing a number if duplicates exist, using uidt as base
  function getUniqueColumnNameByUidt(uidt: string, fields: any[]): string {
    const baseName = toTitleCase(uidt);
    const existingNames = fields.map(f => (f.name || f.title || f.key || '').toLowerCase());
    let name = baseName;
    let counter = 1;
    while (existingNames.includes(name.toLowerCase())) {
      const match = name.match(/^(.*?)(\s(\d+))?$/);
      if (match) {
        const prefix = match[1];
        const num = match[3] ? parseInt(match[3], 10) : 0;
        counter = num + 1;
        name = `${prefix} ${counter}`;
      } else {
        name = `${baseName} ${counter}`;
      }
    }
    return name;
  }

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setStep(2);
        setFieldName(initialValues.title || '');
        // Try both type (normalized) and uidt (original from API) for field type matching
        setSelectedType(FIELD_TYPES.find(t => t.key === initialValues.type || t.key === initialValues.uidt) || null);

        // Get config from meta or config property
        // API response structure: column.meta.defaultValue -> becomes config.defaultValue here
        const config = initialValues.meta || initialValues.config || {};
        // Use both type (normalized) and uidt (original from API) for field type
        const fieldType = initialValues.type || initialValues.uidt;

        // defaultValue is always in config.defaultValue (from meta.defaultValue in API response)
        // initialValues.defaultValue doesn't exist at top level - it's nested in meta/config
        setDefaultValue(config.defaultValue || '');
        setDescription(initialValues.description || '');
        setRichText(!!config.richText);
        setShowThousands(!!config.showThousands);
        setPrecision(config.precision || '1.0');
        // Boolean/checkbox fields: check both saved format (icon/color/defaultValue) and state format (checkboxIcon/checkboxColor/checkboxDefault)
        setCheckboxIcon(config.checkboxIcon || config.icon || 'check');
        setCheckboxColor(config.checkboxColor || config.color || 'green');
        setCheckboxDefault(config.checkboxDefault !== undefined ? !!config.checkboxDefault : (config.defaultValue !== undefined ? !!config.defaultValue : false));
        setSelectOptions(
          (config.options || config.selectOptions || []).map((o: any) =>
            typeof o === 'string' ? { option: o, color: '' } : { option: o.option, color: o.color || '' }
          )
        );
        // Load default values based on field type - check defaultValue first (where it's saved), then fallback to type-specific keys
        if (fieldType === 'multiSelect') {
          setMultiDefault(Array.isArray(config.defaultValue) ? config.defaultValue : (config.multiDefault || []));
        } else {
        setMultiDefault(config.multiDefault || []);
        }
        if (fieldType === 'select') {
          setSingleDefault(typeof config.defaultValue === 'string' && config.defaultValue ? config.defaultValue : (config.singleDefault || ''));
        } else {
        setSingleDefault(config.singleDefault || '');
        }
        setRatingIcon(config.ratingIcon || 'star');
        setRatingColor(config.ratingColor || 'yellow');
        setRatingMax(config.ratingMax || 5);
        setRatingDefault(config.ratingDefault || 0);
        setDateFormat(config.dateFormat || 'YYYY-MM-DD');
        setTimeFormat(config.timeFormat || 'hh:mm');
        setHourFormat(config.hourFormat || '24');
        setDisplayTimeZone(!!config.displayTimeZone);
        setSameTimezone(!!config.sameTimezone);
        setTimeZone(
          config.timeZoneLabel ||
          (config.timeZone ? (timeZoneOptions.find((o: any) => o.value === config.timeZone)?.label || '') : '')
        );
        // For datetime: check defaultValue first (where it's saved), then fallback to dateTimeDefault
        if (fieldType === 'datetime') {
          setDateTimeDefault(config.defaultValue || config.dateTimeDefault || '');
        } else {
        setDateTimeDefault(config.dateTimeDefault || '');
        }
        setShowDateTimeDefault(false);
        // For year: check defaultValue first (where it's saved), then fallback to yearDefault
        if (fieldType === 'year') {
          setYearDefault(config.defaultValue !== undefined && config.defaultValue !== null ? config.defaultValue : (config.yearDefault || null));
        } else {
        setYearDefault(config.yearDefault || null);
        }
        // For date: check defaultValue first (where it's saved), then fallback to dateDefault
        if (fieldType === 'date') {
          setDateDefault(config.defaultValue || config.dateDefault || '');
        } else {
        setDateDefault(config.dateDefault || '');
        }
        // For time: check defaultValue first (where it's saved), then fallback to timeDefault
        if (fieldType === 'time') {
          setTimeDefault(config.defaultValue || config.timeDefault || '');
        } else {
        setTimeDefault(config.timeDefault || '');
        }
        setShowTimeDefault(false);
        setPhoneValid(!!config.phoneValid);
        // For phone: check defaultValue first (where it's saved), then fallback to phoneDefault
        if (fieldType === 'phoneNumber') {
          setPhoneDefault(config.defaultValue || config.phoneDefault || '');
        } else {
        setPhoneDefault(config.phoneDefault || '');
        }
        setShowPhoneDefault(false);
        setEmailValid(!!config.emailValid);
        // For email: check defaultValue first (where it's saved), then fallback to emailDefault
        if (fieldType === 'email') {
          setEmailDefault(config.defaultValue || config.emailDefault || '');
        } else {
        setEmailDefault(config.emailDefault || '');
        }
        setShowEmailDefault(false);
        setUrlValid(!!config.urlValid);
        // For url: check defaultValue first (where it's saved), then fallback to urlDefault
        if (fieldType === 'url') {
          setUrlDefault(config.defaultValue || config.urlDefault || '');
        } else {
        setUrlDefault(config.urlDefault || '');
        }
        setShowUrlDefault(false);

        // Note: Lookup field initialization is handled in a separate useEffect
        // that runs when linkFields become available (see above)
        setShowUrlIcon(config.showUrlIcon !== false);
        setDisplayAsProgress(!!config.displayAsProgress);
        setShowPercentDefault(false);
        // For percent: check defaultValue first (where it's saved), then fallback to percentDefault
        if (fieldType === 'percent') {
          setPercentDefault(config.defaultValue !== undefined && config.defaultValue !== null ? config.defaultValue : (config.percentDefault || null));
        } else {
        setPercentDefault(config.percentDefault || null);
        }
        setDurationFormat(config.durationFormat || 'h:mm');
        // For duration: check defaultValue first (where it's saved), then fallback to durationDefault
        if (fieldType === 'duration') {
          setDurationDefault(config.defaultValue !== undefined && config.defaultValue !== null ? config.defaultValue : (config.durationDefault || 0));
        } else {
        setDurationDefault(config.durationDefault || 0);
        }
        setCurrencyType(config.currencyType || 'USD');
        setCurrencyLocale(config.currencyLocale || 'en-US');
        // For currency: check defaultValue first (where it's saved), then fallback to currencyDefault
        if (fieldType === 'currency') {
          setCurrencyDefault(config.defaultValue !== undefined && config.defaultValue !== null ? config.defaultValue : (config.currencyDefault || null));
        } else {
        setCurrencyDefault(config.currencyDefault || null);
        }
        setShowCurrencyDefault(false);
        // Initialize Links field configuration
        if (fieldType === 'links') {
          const relation = config.relation || config.meta?.relation || {};
          setRelationType(relation.type || 'one-to-one');
          const targetTableId = relation.with || '';
          setSelectedTableId(targetTableId);
        }
        setShowTextDefault(false);
        setShowDescription(false);
        setShowThousandsToggle(false);
        setSearch('');
      } else {
        setStep(1);
        setFieldName('');
        setSearch('');
        setSelectedType(null);
        setDefaultValue('');
        setDescription('');
        setRichText(false);
        setShowThousands(false);
        setPrecision('1.0');
        setCheckboxIcon('check');
        setCheckboxColor('green');
        setCheckboxDefault(false);
        setSelectOptions([]);
        setColor('');
        setNewOption('');
        setMultiDefault([]);
        setSingleDefault('');
        setRatingIcon('star');
        setRatingColor('yellow');
        setRatingMax(5);
        setRatingDefault(0);
        setDateFormat('YYYY-MM-DD');
        setTimeFormat('hh:mm');
        setHourFormat('24');
        setDisplayTimeZone(false);
        setSameTimezone(false);
        setTimeZone('');
        setDateTimeDefault('');
        setShowDateTimeDefault(false);
        setYearDefault(null);
        setDateDefault('');
        setShowDateDefault(false);
        setTimeDefault('');
        setShowTimeDefault(false);
        setPhoneValid(false);
        setPhoneDefault('');
        setShowPhoneDefault(false);
        setEmailValid(false);
        setEmailDefault('');
        setShowEmailDefault(false);
        setUrlValid(false);
        setUrlDefault('');
        setShowUrlDefault(false);
        setShowUrlIcon(true);
        setDisplayAsProgress(false);
        setShowPercentDefault(false);
        setPercentDefault(null);
        setDurationFormat('h:mm');
        setDurationDefault(0);
        setCurrencyType('USD');
        setCurrencyLocale('en-US');
        setCurrencyDefault(null);
        setShowCurrencyDefault(false);
        setShowTextDefault(false);
        setShowDescription(false);
        setShowThousandsToggle(false);
        // Reset user field config state
        setAllowMultipleUsers(false);
        // Reset links field config state
        setRelationType('one-to-one');
        setSelectedTableId('');
        setSelectedTable(null);
        // Reset lookup field config state
        setSelectedRelationId('');
        setSelectedLookupColumnId('');
        setTargetTableFields([]);
        // Reset button field config state
        setButtonStyle('primary');
        setButtonAction('url');
        setOpenButtonInNewTab(true);
        // Reset json field config state
        // Reset createdBy/lastModifiedBy field config state
      }
      setNameError(null);
      setFormulaError(null);
    } else {
      // Reset all state when modal closes
      setStep(null);
      setFieldName('');
      setSearch('');
      setSelectedType(null);
      setDefaultValue('');
      setDescription('');
      setRichText(false);
      setShowThousands(false);
      setPrecision('1.0');
      setCheckboxIcon('check');
      setCheckboxColor('green');
      setCheckboxDefault(false);
      setSelectOptions([]);
      setColor('');
      setNewOption('');
      setMultiDefault([]);
      setSingleDefault('');
      setRatingIcon('star');
      setRatingColor('yellow');
      setRatingMax(5);
      setRatingDefault(0);
      setDateFormat('YYYY-MM-DD');
      setTimeFormat('hh:mm');
      setHourFormat('24');
      setDisplayTimeZone(false);
      setSameTimezone(false);
      setTimeZone('');
      setDateTimeDefault('');
      setShowDateTimeDefault(false);
      setYearDefault(null);
      setDateDefault('');
      setShowDateDefault(false);
      setTimeDefault('');
      setShowTimeDefault(false);
      setPhoneValid(false);
      setPhoneDefault('');
      setShowPhoneDefault(false);
      setEmailValid(false);
      setEmailDefault('');
      setShowEmailDefault(false);
      setUrlValid(false);
      setUrlDefault('');
      setShowUrlDefault(false);
      setShowUrlIcon(true);
      setDisplayAsProgress(false);
      setShowPercentDefault(false);
      setPercentDefault(null);
      setDurationFormat('h:mm');
      setDurationDefault(0);
      setCurrencyType('USD');
      setCurrencyDefault(null);
      setShowCurrencyDefault(false);
      setShowTextDefault(false);
      setShowDescription(false);
      setShowThousandsToggle(false);
      setAllowMultipleUsers(false);
      setRelationType('one-to-one');
      setSelectedTableId('');
      setSelectedTable(null);
      setSelectedRelationId('');
      setSelectedLookupColumnId('');
      setTargetTableFields([]);
      setButtonStyle('primary');
      setButtonAction('url');
      setOpenButtonInNewTab(true);
      setNameError(null);
      setFormulaError(null);
      setShowYearDefault(false);
      setShowPercentDefault(false);
      setShowJsonDefault(false);
      setIsSaving(false);
    }
  }, [isOpen, initialValues]);

  // Debounced check for duplicate field name (step 1 only)
  useEffect(() => {
    if (step !== 1) return;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const trimmed = fieldName.trim().toLowerCase();
      const currentId = initialValues?.id || initialValues?.key;
      const isDuplicate = fields.some(f =>
        (f.name || f.title || f.key || '').toLowerCase() === trimmed &&
        (currentId ? (f.id || f.key) !== currentId : true)
      );
      if (trimmed && isDuplicate) {
        setNameError('Field name already exists');
      } else {
        setNameError(null);
      }
    }, 400); // 400ms debounce
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [fieldName, fields, step, initialValues]);

  // Auto-focus field name input when modal opens and step is 1 or 2
  useEffect(() => {
    if (isOpen && (step === 1 || step === 2) && fieldNameInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        fieldNameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  // Filter out hidden field types (button, formula, uuid) from user selection
  const filteredTypes: FieldType[] = FIELD_TYPES
    .filter(type => !(type as any).hidden)
    .filter((t: FieldType) =>
      t.label.toLowerCase().includes(search.toLowerCase())
    )
  // .sort((a: FieldType, b: FieldType) => a.label.localeCompare(b.label));


  const getOptionColor = (option: string, index: number) => {
    const colors = [
      '#DBEAFE', // blue-100
      '#DCFCE7', // green-100
      '#F3E8FF', // purple-100
      '#FFEDD5', // orange-100
      '#FCE7F3', // pink-100
      '#E0E7FF', // indigo-100
      '#CFFAFE', // cyan-100
      '#FEE2E2', // red-100
      '#FEF9C3', // yellow-100
      '#CCFBF1', // green-100
    ];
    return colors[index % colors.length];
  };

  function getBrowserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  const handleTypeSelect = (type: FieldType) => {
    if (nameError) return;

    // Check if field is used as critical field - block type change
    if (initialValues?.id) {
      // Use currentTableViews (which prefers tableData.views) instead of allViews
      const criticalFieldUsage = checkCriticalFieldUsageInViews(initialValues.id, currentTableViews, currentTableId);
      if (criticalFieldUsage.isUsedInViews) {
        const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
        toast.error(
          `Cannot change field type. This field is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
          { title: 'Field in Use' }
        );
        return;
      }
    }

    setSelectedType(type);
    setStep(2);
    // Reset config state
    setDefaultValue('');
    setDescription('');
    setRichText(false);
    setShowThousands(false);
    setPrecision('1.0');
    // Reset checkbox config state
    setCheckboxIcon('check');
    setCheckboxColor('green');
    setCheckboxDefault(false);
    // Reset select/multiselect config state
    setSelectOptions([]);
    setNewOption('');
    setMultiDefault([]);
    setSingleDefault('');
    // Reset rating config state
    setRatingIcon('star');
    setRatingColor('yellow');
    setRatingMax(5);
    setRatingDefault(0);
    setDateFormat('YYYY-MM-DD');
    setTimeFormat('hh:mm');
    setHourFormat('24');
    setDisplayTimeZone(false);
    setSameTimezone(false);
    setTimeZone('');
    setDateTimeDefault('');
    setShowDateTimeDefault(false);
    // Reset currency config state
    setCurrencyType('USD');
    setCurrencyDefault(null);
    setShowCurrencyDefault(false);
    // Reset text config state
    setShowTextDefault(false);
    setShowDescription(false);
    setShowThousandsToggle(false);
    // Reset user field config state
    setAllowMultipleUsers(false);
    // Reset links field config state
    setRelationType('one-to-one');
    setSelectedTableId('');
    setSelectedTable(null);
    // Reset lookup field config state
    setSelectedRelationId('');
    setSelectedLookupColumnId('');
    setTargetTableFields([]);
    // Reset button field config state
    setButtonStyle('primary');
    setButtonAction('url');
    setOpenButtonInNewTab(true);
    // Reset formula field config state
    setFormulaText('');
    setFormulaError(null);
    // Reset json field config state
  };

  const handleSave = () => {
    // Prevent multiple clicks
    if (isSaving) return;

    setIsSaving(true);

    // If fieldName is empty, generate a unique name using uidt
    let finalFieldName = fieldName?.trim();
    if (!finalFieldName) {
      const uidtBase = selectedType?.key || 'Field';
      finalFieldName = getUniqueColumnNameByUidt(uidtBase, fields);
      setFieldName(finalFieldName); // Optionally update the UI as well
    }

    const trimmed = fieldName.trim().toLowerCase();
    const currentId = initialValues?.id || initialValues?.key;
    const isDuplicate = fields.some(f =>
      (f.name || f.title || f.key || '').toLowerCase() === trimmed &&
      (currentId ? (f.id || f.key) !== currentId : true)
    );
    if (isDuplicate) {
      setNameError('Field name already exists');
      setIsSaving(false);
      return;
    }

    // Check for formula errors if field type is formula
    if (selectedType?.key === 'formula' && formulaError) {
      setIsSaving(false);
      return;
    }

    if (!selectedType) {
      setIsSaving(false);
      return;
    }

    const config: any = {};
    if (defaultValue && (typeof defaultValue === 'string' ? defaultValue.trim() : true)) {
      switch (selectedType.key) {
        case 'number':
        case 'decimal':
        case 'currency':
        case 'percent':
          if (defaultValue && (typeof defaultValue === 'string' ? defaultValue.trim() : true)) {
            const parsed = typeof defaultValue === 'string' ? parseFloat(defaultValue) : defaultValue;
            config.defaultValue = !isNaN(parsed) ? parsed : defaultValue;
          }
          break;
        case 'boolean':
          config.defaultValue = defaultValue === 'true' || defaultValue === '1';
          break;
        case 'rating':
          config.defaultValue = parseInt(defaultValue) || 0;
          break;
        case 'year':
          config.defaultValue = typeof defaultValue === 'string' ? (parseInt(defaultValue) || defaultValue) : defaultValue;
          break;
        case 'json':
          if (typeof defaultValue === 'object') {
            config.defaultValue = defaultValue;
          } else {
            try {
              config.defaultValue = JSON.parse(defaultValue);
            } catch {
              config.defaultValue = defaultValue;
            }
          }
          break;
        default:
          config.defaultValue = defaultValue;
      }
    }

    // Don't add description to config - it's handled at column level

    // Add type-specific config
    if (selectedType.key === 'longText') {
      config.richText = richText;
    }
    if (selectedType.key === 'number') {
      config.showThousands = showThousands;
    }
    if (selectedType.key === 'decimal') {
      config.precision = precision;
      config.showThousands = showThousands;
    }
    if (selectedType.key === 'boolean') {
      config.icon = checkboxIcon;
      config.color = checkboxColor;
      config.defaultValue = checkboxDefault;
    }
    if (selectedType.key === 'select') {
      config.options = selectOptions;
      if (singleDefault && singleDefault.trim()) {
        config.defaultValue = singleDefault;
      }
    }
    if (selectedType.key === 'multiSelect') {
      config.options = selectOptions;
      if (multiDefault && multiDefault.length > 0) {
        config.defaultValue = multiDefault;
      }
    }
    if (selectedType.key === 'rating') {
      config.ratingIcon = ratingIcon;
      config.ratingColor = ratingColor;
      config.ratingMax = ratingMax;
      config.ratingDefault = ratingDefault;
      config.ratingDescription = description;

    }
    if (selectedType.key === 'datetime') {
      config.dateFormat = dateFormat;
      // Use the selected timeFormat without overriding
      config.timeFormat = timeFormat;
      config.hourFormat = hourFormat;
      config.displayTimeZone = displayTimeZone;
      config.sameTimezone = sameTimezone;
      if (sameTimezone && timeZone) {
        const selectedCode = timeZoneOptions.find((o: any) => o.label === timeZone)?.value || '';
        config.timeZone = selectedCode;
        config.timeZoneLabel = timeZone;
      } else if (displayTimeZone && !sameTimezone) {
        const browserLabel = getBrowserTimeZone();
        const browserCode = timeZoneOptions.find((o: any) => o.label === browserLabel)?.value || '';
        if (browserCode) {
          config.timeZone = browserCode;
          config.timeZoneLabel = browserLabel;
        }
      }
      if (dateTimeDefault && dateTimeDefault.trim()) {
        // Ensure datetime includes both date and time
        let formattedDateTime = dateTimeDefault;
        if (!formattedDateTime.includes('T')) {
          // If only time is provided, add current date
          const today = new Date().toISOString().split('T')[0];
          formattedDateTime = `${today}T${formattedDateTime}`;
        }
        config.defaultValue = formattedDateTime;
      }
    }
    if (selectedType.key === 'createdTime') {
      config.dateFormat = dateFormat;
      // Use the selected timeFormat without overriding
      config.timeFormat = timeFormat;
      config.hourFormat = hourFormat;
      config.displayTimeZone = displayTimeZone;
      config.sameTimezone = sameTimezone;
      if (sameTimezone && timeZone) {
        const selectedCode = timeZoneOptions.find((o: any) => o.label === timeZone)?.value || '';
        config.timeZone = selectedCode;
        config.timeZoneLabel = timeZone;
      } else if (displayTimeZone && !sameTimezone) {
        const browserLabel = getBrowserTimeZone();
        const browserCode = timeZoneOptions.find((o: any) => o.label === browserLabel)?.value || '';
        if (browserCode) {
          config.timeZone = browserCode;
          config.timeZoneLabel = browserLabel;
        }
      }
      // No default value for createdTime - it's automatically set by the system
    }
    if (selectedType.key === 'lastModifiedTime') {
      config.dateFormat = dateFormat;
      // Use the selected timeFormat without overriding
      config.timeFormat = timeFormat;
      config.hourFormat = hourFormat;
      config.displayTimeZone = displayTimeZone;
      config.sameTimezone = sameTimezone;
      if (sameTimezone && timeZone) {
        const selectedCode = timeZoneOptions.find((o: any) => o.label === timeZone)?.value || '';
        config.timeZone = selectedCode;
        config.timeZoneLabel = timeZone;
      } else if (displayTimeZone && !sameTimezone) {
        const browserLabel = getBrowserTimeZone();
        const browserCode = timeZoneOptions.find((o: any) => o.label === browserLabel)?.value || '';
        if (browserCode) {
          config.timeZone = browserCode;
          config.timeZoneLabel = browserLabel;
        }
      }
      // No default value for lastModifiedTime - it's automatically set by the system
    }
    if (selectedType.key === 'currency') {
      config.currencyType = currencyType;
      config.currencyLocale = currencyLocale;
      config.precision = precision;
      if (currencyDefault) {
        config.defaultValue = currencyDefault;
      }
    }
    if (selectedType.key === 'percent') {
      config.displayAsProgress = displayAsProgress;
      config.progressColor = progressColor;
      if (percentDefault !== null) {
        config.defaultValue = percentDefault;
      }
    }
    if (selectedType.key === 'duration') {
      config.durationFormat = durationFormat;
      if (durationDefault) {
        config.defaultValue = durationDefault;
      }
    }
    if (selectedType.key === 'year') {
      if (yearDefault !== null) {
        config.defaultValue = yearDefault;
      }
    }
    if (selectedType.key === 'date') {
      config.dateFormat = dateFormat;
      if (dateDefault && dateDefault.trim()) {
        config.defaultValue = dateDefault;
      }
    }
    if (selectedType.key === 'time') {
      config.hourFormat = hourFormat;
      // Use the selected timeFormat without overriding
      config.timeFormat = timeFormat;
      if (timeDefault && timeDefault.trim()) {
        // Ensure time is in 24-hour format for storage
        let formattedTime = timeDefault;
        if (hourFormat === '12' && timeDefault.includes(' ')) {
          const [time, period] = timeDefault.split(' ');
          const [hours, minutes] = time.split(':');
          let hour = parseInt(hours);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
        }
        config.defaultValue = formattedTime;
      }
    }
    if (selectedType.key === 'text') {
      // Text field specific config
      if (defaultValue && (typeof defaultValue === 'string' ? defaultValue.trim() : true)) {
        config.defaultValue = defaultValue;
      }
    }
    if (selectedType.key === 'phoneNumber') {
      config.phoneValid = phoneValid;
      if (phoneDefault && phoneDefault.trim()) {
        config.defaultValue = phoneDefault;
      }
    }
    if (selectedType.key === 'email') {
      config.emailValid = emailValid;
      if (emailDefault && emailDefault.trim()) {
        config.defaultValue = emailDefault;
      }
    }
    if (selectedType.key === 'url') {
      config.urlValid = urlValid;
      config.showIcon = showUrlIcon;
      if (urlDefault && urlDefault.trim()) {
        config.defaultValue = urlDefault;
      }
    }
    // if (selectedType.key === 'user') {
    //   config.allowMultiple = allowMultipleUsers;
    //   if (userDefault && userDefault.trim()) {
    //     config.defaultValue = userDefault;
    //   }
    //   if (description && description.trim()) {
    //     config.description = description;
    //   }
    // }
    if (selectedType.key === 'user') {
      config.allowMultiple = allowMultipleUsers;
      if (selectedUsers) {
        config.defaultValue = selectedUsers;
      }
    }

    if (selectedType.key === 'links') {
      if (!selectedTableId || !selectedTable) {
        toast.error('Target table is required for relation fields');
        setIsSaving(false);
        return; // Prevent saving without target table
      }
      config.relation = {
        with: selectedTableId,
        type: relationType
      };
    }
    if (selectedType.key === 'lookup') {
      if (!selectedRelationId) {
        toast.error('Please select a Link Field');
        setIsSaving(false);
        return;
      }
      if (!selectedLookupColumnId) {
        toast.error('Please select a Lookup Field');
        setIsSaving(false);
        return;
      }
      // Get the relation_id from the selected link field's meta, not the field's ID
      const selectedLinkField = linkFields.find(f => f.id === selectedRelationId);
      const relationIdFromMeta = selectedLinkField?.meta?.relation_id || selectedLinkField?.config?.relation_id;

      if (!relationIdFromMeta) {
        toast.error('Selected link field does not have a valid relation_id');
        setIsSaving(false);
        return;
      }

      // Send the correct meta structure for lookup field (matching API expected format)
      // relation_id should come from the link field's meta.relation_id, not the field ID
      config.relation_id = relationIdFromMeta;
      config.lookup_column_id = selectedLookupColumnId;
    }
    if (selectedType.key === 'button') {
      if (defaultValue && (typeof defaultValue === 'string' ? defaultValue.trim() : true)) {
        config.buttonText = String(defaultValue);
      }
      config.buttonStyle = buttonStyle;
      config.action = buttonAction;
      config.openInNewTab = openButtonInNewTab;
    }
    if (selectedType.key === 'json') {
      // JSON field always uses pretty print and collapsible (no longer configurable)
      if (defaultValue && (typeof defaultValue === 'string' ? defaultValue.trim() : true)) {
        config.defaultValue = defaultValue;
      }
    }
    if (selectedType.key === 'formula') {
      config.formula = formulaText;
      config.formatting = {
        type: formulaFormatting.type,
        precision: formulaFormatting.precision,
        currency: formulaFormatting.currency,
        dateFormat: formulaFormatting.dateFormat
      };
    }
    // Attachment field only supports description configuration

    // Use getUniqueColumnNameByUidt to ensure no duplicate column names, using type as base
    const uidtBase = selectedType?.key || 'Field';
    const uniqueColName = getUniqueColumnNameByUidt(uidtBase, fields);
    const colConfig: any = {
      key: fieldName || uniqueColName,
      title: fieldName || uniqueColName,
      name: fieldName || uniqueColName,
      type: selectedType.key,
      description: description,
      meta: config, // Use 'meta' instead of 'config' for new API format
    };

    onSave(colConfig);
    // Don't reset state here - let the parent component close the modal
    // State will be reset when the modal closes via useEffect
  };

  if (!isOpen) return null;

  const handleDateChange = (value: any) => {
    if (value) {
      setDateDefault(value);
    }
  };

  const handleYearChange = (value: number | null | string) => {
    if (typeof value === 'number') {
      setYearDefault(value);
    } else if (value === null || value === '') {
      setYearDefault(null);
    } else {
      const parsedValue = parseInt(value);
      setYearDefault(isNaN(parsedValue) ? null : parsedValue);
    }
  };

  const formatDefaultDate = (date: any) => {
    // Format the date based on the selected format
    if (date) {
      const currentFormat = dateFormat; // Use your detection logic
      return convertDateFormat(date, currentFormat, dateFormat);
    }
    return '';
  };

  const handleUrlChange = (value: string) => {
    setUrlDefault(value);
  };

  const handleJsonChange = (value: any) => {
    const stringify = JSON.stringify(value, null, 2);
    setDefaultValue(stringify);
  };

  // Format default value based on precision
  const formatDefaultValueWithPrecision = (value: string, precision: string | number) => {
    if (!value || !precision) return value;

    const decimalPlaces = typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;

    return numValue.toFixed(decimalPlaces);
  };

  // Handle precision change - components will handle their own formatting
  const handlePrecisionChange = (newPrecision: string | number) => {
    setPrecision(newPrecision);
  };

  // Config step for each type
  function renderConfigStep() {
    switch (selectedType?.key) {
      case 'text':
      case 'uuid':
        return (
          <>
            <div className="mb-3 space-y-2 " >
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
                onClick={() => setShowTextDefault(v => !v)}>
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showTextDefault && (
                <SingleLineText
                  value={defaultValue}
                  onChange={value => setDefaultValue(value)}
                  placeholder="Enter default text"
                  isBorder={true}
                />
              )}
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'longText':
        return (
          <>
            <div className="mb-3 flex items-center gap-2">
              <input type="checkbox" className="checkbox-primary-brand" id="richText" checked={richText} onChange={e => setRichText(e.target.checked)} />
              <label htmlFor="richText" className="text-sm text-[var(--text-color-secondary)]">Enable rich text</label>
            </div>
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showTextDefault && (
              <LongText
                value={defaultValue}
                onChange={value => setDefaultValue(value)}
                placeholder="Enter default text value"
                minRows={4} // Minimum rows for the input
                isBorder={true}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'number':
        return (
          <>
            <div className="mb-3 flex items-center gap-2">
              <input type="checkbox" className="checkbox-primary-brand" id="showThousands" checked={showThousands} onChange={e => setShowThousands(e.target.checked)} />
              <label htmlFor="showThousands" className="text-sm text-[var(--text-color-secondary)]" >Show thousands separator</label>
            </div>
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showTextDefault && (
              <Number
                value={defaultValue}
                onChange={value => setDefaultValue(value?.toString() || '')}
                config={{
                  showThousands: showThousands
                }}
                isBorder={true}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'decimal':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-gray-700)]">Precision</div>
            <AdvancedDropdown
              options={precisionOptions}
              value={precision}
              onChange={(val) => handlePrecisionChange(val as string)}
            />

            <div className="my-3 flex items-center gap-2">
              <input type="checkbox" className="checkbox-primary-brand" id="showThousands" checked={showThousands} onChange={e => setShowThousands(e.target.checked)} />
              <label htmlFor="showThousands" className="text-sm text-[var(--text-color-secondary)]">Show thousands separator</label>
            </div>
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showTextDefault && (
              <Decimal
                value={defaultValue ? parseFloat(defaultValue) : null}
                onChange={(value: any) => setDefaultValue(value?.toString() || '')}
                showThousands={showThousands}
                config={{
                  precision: typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision,
                  defaultValue: defaultValue ? (isNaN(parseFloat(defaultValue)) ? defaultValue : parseFloat(defaultValue)) : undefined
                }}
                isBorder={true}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'boolean':
        const iconOptions: { key: string; label: string; checkedIcon: any; uncheckedIcon: any }[] = [
          {
            key: 'check',
            label: 'Check',
            checkedIcon: (
              <div className="w-4 h-4 rounded flex items-center justify-center bg-green-500 border-green-500">
                <Check className="w-2.5 h-2.5 text-primary" />
              </div>
            ),
            uncheckedIcon: (
              <div className="w-4 h-4 rounded flex items-center justify-center">
                <Square className="w-4 h-4 text-gray-400" />
              </div>
            )
          },
          {
            key: 'circle',
            label: 'Circle',
            checkedIcon: (
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-green-500 border-green-500">
                <Check className="w-2.5 h-2.5 text-primary" />
              </div>
            ),
            uncheckedIcon: (
              <div className="w-4 h-4 rounded-full flex items-center justify-center">
                <Circle className="w-4 h-4 text-gray-400" />
              </div>
            )
          },
          {
            key: 'star',
            label: 'Star',
            checkedIcon: <Star className="w-4 h-4 text-yellow-500 fill-current" />,
            uncheckedIcon: <Star className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'heart',
            label: 'Heart',
            checkedIcon: <Heart className="w-4 h-4 text-red-500 fill-current" />,
            uncheckedIcon: <Heart className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'thumb',
            label: 'Thumb',
            checkedIcon: <ThumbsUp className="w-4 h-4 text-green-500 fill-current" />,
            uncheckedIcon: <ThumbsDown className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'flag',
            label: 'Flag',
            checkedIcon: <Flag className="w-4 h-4 text-red-500 fill-current" />,
            uncheckedIcon: <Flag className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'badge',
            label: 'Badge',
            checkedIcon: <BadgeCheck className="w-4 h-4 text-blue-500 fill-current" />,
            uncheckedIcon: <BadgeCheck className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'shield',
            label: 'Shield',
            checkedIcon: <ShieldCheck className="w-4 h-4 text-purple-500 fill-current" />,
            uncheckedIcon: <ShieldCheck className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'award',
            label: 'Award',
            checkedIcon: <Award className="w-4 h-4 text-orange-500 fill-current" />,
            uncheckedIcon: <Award className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'trophy',
            label: 'Trophy',
            checkedIcon: <Trophy className="w-4 h-4 text-yellow-500 fill-current" />,
            uncheckedIcon: <Trophy className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'medal',
            label: 'Medal',
            checkedIcon: <Medal className="w-4 h-4 text-amber-500 fill-current" />,
            uncheckedIcon: <Medal className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'crown',
            label: 'Crown',
            checkedIcon: <Crown className="w-4 h-4 text-yellow-500 fill-current" />,
            uncheckedIcon: <Crown className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'gem',
            label: 'Gem',
            checkedIcon: <Gem className="w-4 h-4 text-purple-500 fill-current" />,
            uncheckedIcon: <Gem className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'diamond',
            label: 'Diamond',
            checkedIcon: <Diamond className="w-4 h-4 text-blue-500 fill-current" />,
            uncheckedIcon: <Diamond className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'zap',
            label: 'Zap',
            checkedIcon: <Zap className="w-4 h-4 text-yellow-500 fill-current" />,
            uncheckedIcon: <Zap className="w-4 h-4 text-gray-400" />
          },
          {
            key: 'sparkles',
            label: 'Sparkles',
            checkedIcon: <Sparkles className="w-4 h-4 text-pink-500 fill-current" />,
            uncheckedIcon: <Sparkles className="w-4 h-4 text-gray-400" />
          },
        ];

        // Checkbox color options
        const colorOptions: { key: string; label: string; className: string; color: string; bgClass: string }[] = [
          { key: 'green', label: 'Green', className: 'text-green-600', color: 'green', bgClass: 'bg-green-500' },
          { key: 'blue', label: 'Blue', className: 'text-blue-600', color: 'blue', bgClass: 'bg-blue-500' },
          { key: 'yellow', label: 'Yellow', className: 'text-yellow-500', color: 'yellow', bgClass: 'bg-yellow-400' },
          { key: 'red', label: 'Red', className: 'text-red-600', color: 'red', bgClass: 'bg-red-500' },
          { key: 'purple', label: 'Purple', className: 'text-purple-600', color: 'purple', bgClass: 'bg-purple-500' },
          { key: 'gray', label: 'Gray', className: 'text-gray-600', color: 'gray', bgClass: 'bg-gray-500' },
        ];

        const selectedIconOption = iconOptions.find(opt => opt.key === checkboxIcon) || iconOptions[0];
        const selectedColorOption = colorOptions.find(opt => opt.key === checkboxColor) || colorOptions[0];

        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Icon Selection */}
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Icon</div>
                <div className="relative icon-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] flex items-center justify-between"
                    onClick={() => setShowIconDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      {selectedIconOption.checkedIcon}
                      {selectedIconOption.uncheckedIcon}
                      <span>{selectedIconOption.label}</span>
                    </div>
                    {!showIconDropdown ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronUp className="h-4 w-4 ml-auto" />}
                  </button>

                  {showIconDropdown && (
                    <div className="absolute p-2 space-y-1 top-full left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {iconOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${checkboxIcon === option.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                            }`}
                          onClick={() => {
                            setCheckboxIcon(option.key);
                            setShowIconDropdown(false);
                          }}
                        >
                          {option.checkedIcon}
                          {option.uncheckedIcon}
                          <span>{option.label}</span>
                          {checkboxIcon === option.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Colour</div>
                <div className="relative color-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] flex items-center justify-between"
                    onClick={() => setShowColorDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${selectedColorOption.bgClass}`}></div>
                      <span>{selectedColorOption.label}</span>
                    </div>
                    {!showColorDropdown ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronUp className="h-4 w-4 ml-auto" />}
                  </button>

                  {showColorDropdown && (
                    <div className="absolute p-2 space-y-1 top-full left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {colorOptions.map((color) => (
                        <button
                          key={color.key}
                          type="button"
                          className={`w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${checkboxColor === color.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                            }`}
                          onClick={() => {
                            setCheckboxColor(color.key);
                            setShowColorDropdown(false);
                          }}
                        >
                          <div className={`w-4 h-4 rounded-full ${color.bgClass}`}></div>
                          <span>{color.label}</span>
                          {checkboxColor === color.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Default Value - Full Width */}
            <div className="mb-4">
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Default value</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] flex items-center gap-2 ${checkboxDefault
                    ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
                    : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'
                    }`}
                  onClick={() => setCheckboxDefault(true)}
                >
                  {selectedIconOption.checkedIcon}
                  <span>Checked</span>
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] flex items-center gap-2 ${!checkboxDefault
                    ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
                    : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'
                    }`}
                  onClick={() => setCheckboxDefault(false)}
                >
                  {selectedIconOption.uncheckedIcon}
                  <span>Unchecked</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="relative">
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] my-3 space-y-2">Description</div>
              <MultiLineText
                placeholder="Enter field description..."
                value={description}
                onChange={value => setDescription(value)}
                rows={4}
                isBorder={true}
              />
              {description &&
                <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            </div>
          </>
        );
      case 'multiSelect':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Options</div>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] bg-[var(--color-alpha-white)] text-[var(--color-gray-900)] rounded-xl text-sm outline-none field-component-focus"
                placeholder="Add option"
                value={newOption}
                onChange={e => {
                  setNewOption(e.target.value);
                  if (optionError) setOptionError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: color && color !== '#cccccc' ? color : '' }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              />
              {/* <input
                type="color"
                value={color || '#cccccc'}
                onChange={(e) => setColor(e.target.value)}
                className="flex-shrink-0 inline-flex items-center justify-center px-2 h-9 border border-[var(--color-gray-300)] text-[var(--color-text-tertiary)] rounded-xl hover:bg-[var(--color-hover-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
                style={{ cursor: 'pointer' }}
              /> */}
              <button
                type="button"
                className="px-3 py-1 btn-add-option text-sm"
                onClick={() => {
                  if (newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: color && color !== '#cccccc' ? color : '' }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              >
                Add option
              </button>
            </div>
            {optionError && <div className="text-red-500 text-xs mt-1 mb-3">{optionError}</div>}

            {selectOptions.length > 0 &&
              <>
                <span className='text-primary'>Select Default Value</span>
                <div className="flex flex-col gap-1 my-2 max-w-full border border-primary rounded-xl p-2 group max-h-48 overflow-auto">
                  {selectOptions.map((opt, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 min-w-0 hover:bg-[var(--color-hover-bg)] rounded-xl px-1">
                      <input
                        type="checkbox"
                        checked={multiDefault.includes(opt.option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMultiDefault([...multiDefault, opt.option]);
                          } else {
                            setMultiDefault(multiDefault.filter(v => v !== opt.option));
                          }
                        }}
                        className="checkbox-primary-brand"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="color"
                        value={opt.color || getOptionColor(opt.option, idx)}
                        onChange={(e) => {
                          const newOptions = [...selectOptions];
                          newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                          setSelectOptions(newOptions);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="color-input"
                      />
                      {editingOptionIndex === idx ? (
                        <input
                          ref={editInputRef}
                          className='flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]'
                          value={editingOptionValue}
                          onChange={(e) => setEditingOptionValue(e.target.value)}
                          onBlur={() => {
                            const trimmedValue = editingOptionValue.trim();
                            if (trimmedValue && trimmedValue !== opt.option) {
                              const newOptions = [...selectOptions];
                              newOptions[idx] = { ...newOptions[idx], option: trimmedValue };
                              setSelectOptions(newOptions);

                              // Update default values if this option was selected
                              if (multiDefault.includes(opt.option)) {
                                setMultiDefault(multiDefault.map(v => v === opt.option ? trimmedValue : v));
                              }
                            }
                            setEditingOptionIndex(null);
                            setEditingOptionValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingOptionIndex(null);
                              setEditingOptionValue('');
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] text-xs truncate min-w-0 cursor-pointer"
                          onClick={() => {
                            setEditingOptionIndex(idx);
                            setEditingOptionValue(opt.option);
                          }}
                        >
                          {opt.option}
                        </span>
                      )}
                      <button
                        type="button"
                        className="h-8 w-8 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectOptions(selectOptions.filter((o, i) => i !== idx));
                          // Remove from defaults if this option was selected
                          if (multiDefault.includes(opt.option)) {
                            setMultiDefault(multiDefault.filter(v => v !== opt.option));
                          }
                        }}
                      >
                        <Trash2 className='w-4 h-4 text-[var(--color-utility-error-400)]' />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            }

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <div className="mb-3 relative">
                    <MultiLineText
                      placeholder="Enter field description..."
                      value={description}
                      onChange={value => setDescription(value)}
                      rows={4}
                      isBorder={true}
                    />
                  </div>
                  {description && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

          </>
        );
      case 'select':
        return (
          <>
            <div className="flex gap-2 mb-3 w-full">
              <input
                className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] bg-[var(--color-alpha-white)] text-[var(--color-gray-900)] rounded-xl text-sm outline-none field-component-focus"
                placeholder="Add option"
                value={newOption}
                onChange={e => {
                  setNewOption(e.target.value);
                  if (optionError) setOptionError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: color && color !== '#cccccc' ? color : '' }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              />
              {/* <input
                type="color"
                value={color || '#cccccc'}
                onChange={(e) => setColor(e.target.value)}
                className="flex-shrink-0 inline-flex items-center justify-center px-2 h-9 border border-[var(--color-gray-300)] text-[var(--color-text-tertiary)] rounded-xl hover:bg-[var(--color-hover-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]"
                style={{ cursor: 'pointer' }}
              /> */}

              <button
                type="button"
                className="px-3 py-1 btn-add-option"
                onClick={() => {
                  if (newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());

                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: color && color !== '#cccccc' ? color : '' }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              >
                Add option
              </button>
            </div>
            {optionError && <div className="text-red-500 text-xs mt-1">{optionError}</div>}
            {selectOptions.length > 0 &&
              <>
                <div className="m-2 text-sm font-medium text-[var(--color-text-tertiary)]">Select Default value</div>
                <div className="flex flex-col gap-1 mb-2 max-w-full border border-primary rounded-xl p-2 group max-h-48 overflow-auto">
                  {selectOptions.map((opt, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 min-w-0 hover:bg-[var(--color-hover-bg)] rounded-xl px-1">
                      <label key={idx} className="inline-flex items-center gap-1 text-[var(--color-gray-700)] cursor-pointer max-w-[200px] min-w-0">
                        <input
                          type="radio"
                          className="flex-shrink-0 checkbox-primary-brand"
                          checked={singleDefault === opt.option}
                          onChange={() => setSingleDefault(opt.option)}
                        />
                      </label>
                      <input
                        type="color"
                        value={opt.color || getOptionColor(opt.option, idx)}
                        onChange={(e) => {
                          const newOptions = [...selectOptions];
                          newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                          setSelectOptions(newOptions);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="color-input"
                      />


                      {editingOptionIndex === idx ? (
                        <input
                          ref={editInputRef}
                          className='flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]'
                          value={editingOptionValue}
                          onChange={(e) => setEditingOptionValue(e.target.value)}
                          onBlur={() => {
                            const trimmedValue = editingOptionValue.trim();
                            if (trimmedValue && trimmedValue !== opt.option) {
                              const newOptions = [...selectOptions];
                              newOptions[idx] = { ...newOptions[idx], option: trimmedValue };
                              setSelectOptions(newOptions);

                              // Update default value if this option was selected
                              if (singleDefault === opt.option) {
                                setSingleDefault(trimmedValue);
                              }
                            }
                            setEditingOptionIndex(null);
                            setEditingOptionValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingOptionIndex(null);
                              setEditingOptionValue('');
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] text-xs truncate min-w-0 cursor-pointer"
                          onClick={() => {
                            setEditingOptionIndex(idx);
                            setEditingOptionValue(opt.option);
                          }}
                        >
                          {opt.option}
                        </span>
                      )}
                      <button
                        type="button"
                        className=" h-8 w-8 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectOptions(selectOptions.filter((o, i) => i !== idx));
                          // Clear default if this option was selected
                          if (singleDefault === opt.option) {
                            setSingleDefault('');
                          }
                        }}
                      >
                        <Trash2 className='w-4 h-4 text-[var(--color-utility-error-400)]' />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            }
            {/* {
              selectOptions.length > 0 && (
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Default value</div>
              )
            } */}
            {/* <div className="flex flex-wrap gap-2 mb-3 max-w-full">
              {selectOptions.map((opt, idx) => (
                <label key={idx} className="inline-flex items-center gap-1 text-[var(--color-gray-700)] cursor-pointer max-w-[200px] min-w-0">
                  <input
                    type="radio"
                    className="flex-shrink-0"
                    checked={singleDefault === opt}
                    onChange={() => setSingleDefault(opt)}
                  />
                  <span className="truncate flex-1 min-w-0">{opt}</span>
                </label>
              ))}
            </div> */}

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <div className="mb-3 relative">
                    <MultiLineText
                      placeholder="Enter field description..."
                      value={description}
                      onChange={value => setDescription(value)}
                      rows={4}
                      isBorder={true}
                    />
                  </div>
                  {description && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'date':
        return (
          <>
            <div className="mb-3 space-y-2">
              <div className="mb-3">
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Date format</div>
                <AdvancedDropdown
                  options={dateFormatOptions}
                  value={dateFormat}
                  onChange={(val) => setDateFormat(val as string)}
                />
              </div>
              <div>
                <button
                  className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-2 space-y-2"
                  onClick={() => setShowDateDefault(v => !v)}
                >
                  <Plus className="w-4 h-4" />
                  Set default value
                </button>
                {showDateDefault && (
                  <DateField
                    value={formatDefaultDate(dateDefault)}
                    onChange={handleDateChange}
                    format={dateFormat}
                    isBorder={true}
                  />
                )}
              </div>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'year':
        return (
          <>
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowYearDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showYearDefault && (
              <Year
                value={yearDefault}
                onChange={handleYearChange}
                isBorder={true}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'time':
        return (
          <>
            <div className="">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Time Display</div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <label className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '12' ?
                    'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={hourFormat === '12'}
                      onChange={() => setHourFormat('12')}
                    />
                    12 Hrs
                  </label>
                  <label className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '24' ?
                    'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={hourFormat === '24'}
                      onChange={() => setHourFormat('24')}
                    />
                    24 Hrs
                  </label>
                </div>
              </div>

              {/* Default Value */}
              <div>
                <button
                  className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2"
                  onClick={() => setShowTimeDefault(v => !v)}
                >
                  <Plus className="w-4 h-4" />
                  Set default value
                </button>
                {showTimeDefault && (
                  <div className="mt-2">
                    <Time
                      value={timeDefault}
                      onChange={setTimeDefault}
                      config={{
                        hourFormat: hourFormat,
                      }}
                      isBorder={true}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button
                      className="absolute right-2 top-0 text-gray-400 hover:text-gray-600 text-sm"
                      onClick={() => setDescription('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'phoneNumber':
        return (
          <>
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneValid}
                    onChange={e => setPhoneValid(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Accept only valid phone numbers</span>
              </div>
              <div>
                <button
                  className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                  onClick={() => setShowPhoneDefault(v => !v)}
                >
                  <Plus className="w-4 h-4" />
                  Set default value
                </button>
                {showPhoneDefault && (
                  <input
                    className="field-component field-component-border field-component-focus"
                    placeholder="Enter default phone number"
                    value={phoneDefault}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^\d{0,12}$/.test(value)) {
                        setPhoneDefault(value);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button
                      className="absolute right-2 top-0.5 text-gray-400 hover:text-gray-600 text-sm"
                      onClick={() => setDescription('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'email':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailValid}
                  onChange={e => setEmailValid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Email validation</span>
            </div>

            {/* Default Value */}
            <div className="mb-0">
              <button
                type="button"
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                onClick={() => setShowEmailDefault(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showEmailDefault && (
                <Email
                  value={emailDefault}
                  onChange={value => setEmailDefault(value)}
                  placeholder="Enter default email..."
                  isBorder={true}
                  config={{
                    emailValid: emailValid
                  }}
                />
              )}
            </div>

            {/* Description */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                onClick={() => setShowDescription(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <textarea
                    className="w-full px-3 py-2 description text-sm focus:outline-none min-h-[60px]"
                    placeholder="Enter field description..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  {description && (
                    <button
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setDescription('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'url':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlValid}
                  onChange={e => setUrlValid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-[var(--color-text-tertiary)]">URL validation</span>
            </div>


            {/* URL Display Options */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUrlIcon}
                    onChange={e => setShowUrlIcon(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Show link icon</span>
              </div>
              <p className="text-xs text-gray-500">Display a clickable link icon next to URLs</p>
            </div>

            {/* Default Value */}
            <div className="mb-4">
              <button
                type="button"
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
                onClick={() => setShowUrlDefault(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showUrlDefault && (
                <div className="mt-2">
                  <URL
                    value={urlDefault}
                    onChange={handleUrlChange}
                    placeholder="e.g. https://example.com"
                    isBorder={true}
                    config={{
                      urlValid: urlValid,
                      showIcon: showUrlIcon
                    }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2"
                onClick={() => setShowDescription(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setDescription('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'percent':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayAsProgress}
                  onChange={e => setDisplayAsProgress(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Display as progress</span>
            </div>

            {displayAsProgress && (
              <>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Progress color</div>
                <AdvancedDropdown
                  options={progressColorOptions}
                  value={progressColor}
                  onChange={(val: any) => setProgressColor(val as string)}
                  placeholder="Select progress color"
                />
              </>
            )}
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowPercentDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showPercentDefault && (
              <input
                type="text"
                className="field-component field-component-border field-component-focus"
                placeholder="Enter default percentage"
                value={percentDefault?.toString() || ''}
                onChange={e => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value) || value === '') {
                    const numericValue = parseFloat(value);
                    if (numericValue >= 0 && numericValue <= 100) {
                      setPercentDefault(numericValue);
                    }
                  }
                }}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'currency':
        return (
          <>
            <div className='flex gap-2 mb-2'>
              <div className='flex-1'>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Locale</div>
                <AdvancedDropdown
                  options={currencyLocaleOptions}
                  value={currencyLocale}
                  onChange={(val) => setCurrencyLocale(val as string)}
                  placeholder="Select Locale"
                  searchable={true}
                />
              </div>
              <div className='flex-1'>
              <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Code</div>
              <AdvancedDropdown
                options={currencyOptions}
                value={currencyType}
                onChange={(val) => setCurrencyType(val as string)}
                placeholder="Select Currency"
                  searchable={true}
              />
              </div>
            </div>
            <div className="mb-4 text-xs text-gray-600">
              Selected currency : {
                currencyType === 'USD' ? '$' :
                  currencyType === 'EUR' ? '€' :
                    currencyType === 'GBP' ? '£' :
                      currencyType === 'JPY' ? '¥' :
                        currencyType === 'CAD' ? 'C$' :
                          currencyType === 'AUD' ? 'A$' :
                            currencyType === 'CHF' ? 'CHF' :
                              currencyType === 'CNY' ? '¥' :
                                currencyType === 'INR' ? '₹' :
                                  currencyType === 'BRL' ? 'R$' : currencyType
              }
            </div>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Precision</div>
            <AdvancedDropdown
              options={precisionOptions}
              value={precision}
              onChange={(val) => handlePrecisionChange(val as string)}
              placeholder="Select precision"
              clearable
            />
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowCurrencyDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showCurrencyDefault && (
              <Currency
                value={currencyDefault}
                onChange={(value: any) => setCurrencyDefault(value)}
                config={{
                  currencyType: currencyType,
                  currencyLocale: currencyLocale,
                  precision: typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision,
                  defaultValue: currencyDefault?.toString() || ''
                }}
                isBorder={true}
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'duration':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Format</div>
            <AdvancedDropdown
              options={durationFormatOptions}
              value={durationFormat}
              onChange={(val) => setDurationFormat(val as string)}
            />

            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDurationDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>

            {showDurationDefault && (
              <Duration
                value={durationDefault}
                onChange={(value) => setDurationDefault(value)}
                isBorder={true}
                config={{
                  durationFormat: durationFormat as "h:mm" | "h:mm:ss" | "h:mm:ss.s" | "h:mm:ss.ss" | "h:mm:ss.sss" | "d:h:mm" | undefined,
                }}
              />
            )}

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'rating':
        const ratingIconOptions = [
          { key: 'star', label: 'Star', icon: <Star className="w-4 h-4" /> },
          { key: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
          { key: 'circle', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
          { key: 'thumb', label: 'Thumb', icon: <ThumbsUp className="w-4 h-4" /> },
          { key: 'flag', label: 'Flag', icon: <Flag className="w-4 h-4" /> },
          { key: 'check', label: 'Check', icon: <CheckCircle className="w-4 h-4" /> },
          { key: 'badge', label: 'Badge', icon: <BadgeCheck className="w-4 h-4" /> },
          { key: 'shield', label: 'Shield', icon: <ShieldCheck className="w-4 h-4" /> },
          { key: 'award', label: 'Award', icon: <Award className="w-4 h-4" /> },
          { key: 'trophy', label: 'Trophy', icon: <Trophy className="w-4 h-4" /> },
          { key: 'medal', label: 'Medal', icon: <Medal className="w-4 h-4" /> },
          { key: 'zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
          { key: 'sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
          { key: 'crown', label: 'Crown', icon: <Crown className="w-4 h-4" /> },
          { key: 'gem', label: 'Gem', icon: <Gem className="w-4 h-4" /> },
          { key: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" /> },
        ];

        const selectedRatingIconOption = ratingIconOptions.find(opt => opt.key === ratingIcon) || ratingIconOptions[0];
        const selectedRatingColorOption = ratingColorOptions.find(opt => opt.key === ratingColor) || ratingColorOptions[0];

        // Helper to render icons for preview - with fill support for filled icons
        const getIcon = (icon: string, isFilled: boolean = false) => {
          const iconProps = {
            className: "w-5 h-5",
            fill: isFilled ? "currentColor" : "none",
          };
          
          const iconMap: Record<string, React.ReactNode> = {
            star: <Star {...iconProps} />,
            heart: <Heart {...iconProps} />,
            circle: <Circle {...iconProps} />,
            thumb: <ThumbsUp {...iconProps} />,
            flag: <Flag {...iconProps} />,
            check: <CheckCircle {...iconProps} />,
            badge: <BadgeCheck {...iconProps} />,
            shield: <ShieldCheck {...iconProps} />,
            award: <Award {...iconProps} />,
            trophy: <Trophy {...iconProps} />,
            medal: <Medal {...iconProps} />,
            zap: <Zap {...iconProps} />,
            sparkles: <Sparkles {...iconProps} />,
            crown: <Crown {...iconProps} />,
            gem: <Gem {...iconProps} />,
            diamond: <Diamond {...iconProps} />
          };
          return iconMap[icon] || iconMap.star;
        };

        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Icon</div>
                <div className="relative rating-icon-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border border-[var(--color-gray-300)] text-[var(--color-text-tertiary)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] flex items-center justify-between"
                    onClick={() => setShowRatingIconDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      {selectedRatingIconOption.icon}
                      <span>{selectedRatingIconOption.label}</span>
                    </div>
                    {!showRatingIconDropdown ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronUp className="h-4 w-4 ml-auto" />}
                  </button>

                  {showRatingIconDropdown && (
                    <div className="absolute top-full p-2 space-y-1 left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {ratingIconOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${ratingIcon === option.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                          onClick={() => {
                            setRatingIcon(option.key);
                            setShowRatingIconDropdown(false);
                          }}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                          {ratingIcon === option.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Colour</div>
                <div className="relative rating-color-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border text-[var(--color-text-tertiary)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] flex items-center justify-between"
                    onClick={() => setShowRatingColorDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: selectedRatingColorOption.color }}></div>
                      <span>{selectedRatingColorOption.label}</span>
                    </div>
                    {!showRatingColorDropdown ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronUp className="h-4 w-4 ml-auto" />}
                  </button>

                  {showRatingColorDropdown && (
                    <div className="absolute top-full p-2 space-y-1 left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {ratingColorOptions.map((color) => (
                        <button
                          key={color.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${ratingColor === color.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                            }`}
                          onClick={() => {
                            setRatingColor(color.key);
                            setShowRatingColorDropdown(false);
                          }}
                        >
                          <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: color.color }}></div>
                          <span>{color.label}</span>
                          {ratingColor === color.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Max Rating - Full Width */}
            <div className="mb-4">
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Max rating</div>
              <Dropdown
                options={[1, 2, 3, 4, 5, 6, 7].map(n => ({ label: n.toString(), value: n.toString() }))}
                value={ratingMax.toString()}
                onChange={(value: any) => setRatingMax(value)}
                placeholder="Select max rating"
              />
            </div>

            {/* Default Value */}
            <div className="mb-3">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-1" onClick={() => setShowRatingDefault(v => !v)}>
                <Plus className="w-4 h-4" />
                Set default value
              </button>

              {showRatingDefault && (
                <div 
                  className="flex items-center gap-2"
                  onMouseLeave={() => setRatingDefaultHover(null)}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: ratingMax }, (_, i) => {
                      const starIndex = i + 1;
                      // Use hover value if set, otherwise use actual default value
                      const currentValue = ratingDefaultHover !== null ? ratingDefaultHover : ratingDefault;
                      const isFilled = currentValue >= starIndex;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRatingDefault(starIndex)}
                          onMouseEnter={() => setRatingDefaultHover(starIndex)}
                          className={`my-1 h-8 w-8 flex items-center justify-center transition-all duration-150 ${isFilled ? 'scale-110' : 'hover:scale-105'
                            }`}
                          title={`Set default to ${starIndex}`}
                        >
                          <span className={isFilled ?
                            (ratingColor === 'yellow' ? 'text-yellow-400 fill-yellow-400' :
                              ratingColor === 'blue' ? 'text-blue-400 fill-blue-400' :
                                ratingColor === 'red' ? 'text-red-400 fill-red-400' :
                                  ratingColor === 'green' ? 'text-green-400 fill-green-400' :
                                    ratingColor === 'purple' ? 'text-purple-400 fill-purple-400' :
                                      ratingColor === 'pink' ? 'text-pink-400 fill-pink-400' :
                                        ratingColor === 'orange' ? 'text-orange-400 fill-orange-400' :
                                          ratingColor === 'indigo' ? 'text-indigo-400 fill-indigo-400' :
                                            ratingColor === 'teal' ? 'text-teal-400 fill-teal-400' :
                                              ratingColor === 'gray' ? 'text-gray-400 fill-gray-400' : 'text-yellow-400 fill-yellow-400') : 'text-gray-300'}>
                            {getIcon(ratingIcon, isFilled)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {ratingDefault > 0 && (
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
                      onClick={() => setRatingDefault(0)}
                      title="Clear default"
                    >
                      Clear
                    </button>
                  )}
                  {
                    ratingDefault > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        {`Default: ${ratingDefault}/${ratingMax}`}
                      </span>
                    )
                  }
                </div>
              )}
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'datetime':
      case 'createdTime':
      case 'lastModifiedTime':
        return (
          <>
            {/* Date Format */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Date Format</label>
              <AdvancedDropdown
                options={dateFormatOptions}
                value={dateFormat}
                onChange={(val) => setDateFormat(val as string)}
              />
            </div>
            {/* Time Format */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Time Format</label>
              <AdvancedDropdown
                options={timeFormatOptions}
                value={timeFormat}
                onChange={(value: any) => setTimeFormat(value)}
              />
            </div>

            {/* Time Display Preference */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Time Display</label>
              <div className="flex items-center gap-2">
                <label className={`flex items-center px-3 py-1.5 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '12'
                  ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                  <input
                    type="radio"
                    className="hidden"
                    checked={hourFormat === '12'}
                    onChange={() => setHourFormat('12')}
                  />
                  12 Hrs
                </label>
                <label className={`flex items-center px-3 py-1.5 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '24' ?
                  'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                  <input
                    type="radio"
                    className="hidden"
                    checked={hourFormat === '24'}
                    onChange={() => setHourFormat('24')}
                  />
                  24 Hrs
                </label>
              </div>
            </div>

            {/* Timezone Options */}
            <div className="mb-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={displayTimeZone}
                      onChange={e => setDisplayTimeZone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-[var(--color-text-tertiary)]">Display time zone</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={sameTimezone}
                      onChange={e => setSameTimezone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-[var(--color-text-tertiary)]">Use same timezone for all members</span>
                </label>
                {sameTimezone && (
                  <div className="mt-2">
                    <AdvancedDropdown
                      options={timeZoneOptions.map((o: any) => ({ label: o.label, value: o.label, rightLabel: o.value, description: o.value }))}
                      value={timeZone}
                      onChange={(val: any) => setTimeZone(val as string)}
                      searchable={true}
                      placeholder="Select time zone"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Default Value - Only show for datetime, not for createdTime/lastModifiedTime */}
            {selectedType?.key === 'datetime' && (
              <div className="mb-3">
                <button
                  type="button"
                  className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
                  onClick={() => setShowDateTimeDefault(v => !v)}
                >
                  <Plus className="w-4 h-4" />
                  Set default value
                </button>
                {showDateTimeDefault && (
                  <div className="mt-2">
                    <DateTime
                      value={dateTimeDefault}
                      onChange={(value: any) => setDateTimeDefault(value)}
                      config={{
                        dateFormat: dateFormat,
                        timeFormat: timeFormat,
                        hourFormat: hourFormat as '12' | '24',
                      }}
                      isBorder={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2"
                onClick={() => setShowDescription(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setDescription('')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'user':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Multiple users</div>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultipleUsers}
                  onChange={e => setAllowMultipleUsers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
              </label>
              <span className="text-sm text-gray-600">When enabled, users can select multiple users</span>
            </div>

            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowUserDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showUserDefault && (
              <User
                value={selectedUsers}
                onChange={(user: any) => setSelectedUsers(user)}
                config={{
                  allowMultiple: allowMultipleUsers,
                  showAvatar: true,
                }}
                isBorder={true}
                placeholder="Select users..."
              />
            )}
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'attachment':
        return (
          <>
            <div className="mb-3 relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </>
        );
      case 'links':
        const isLinksFieldEditing = initialValues && (initialValues.type === 'links' || initialValues.uidt === 'links');
        return (
          <>
            <div className="mb-4">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Relation Type</span>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 border border rounded-md p-2 mb-2">
                  <span className="font-medium text-gray-700">What is a Link?</span> A link creates a relationship between tables to reference related records.
                  Example: link "Orders" to "Customers" to see which customer placed each order.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLinksFieldEditing}
                  className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                    } ${relationType === 'one-to-one'
                      ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                    : 'text-[var(--color-text-primary)] border'
                    }`}
                  onClick={() => !isLinksFieldEditing && setRelationType('one-to-one')}
                  title="Each record in this table links to exactly one record in the target table, and vice versa"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10C11.8954 10 11 9.10457 11 8C11 6.89543 11.8954 6 13 6C14.1046 6 15 6.89543 15 8C15 9.10457 14.1046 10 13 10Z" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 10C1.89543 10 1 9.10457 1 8C1 6.89543 1.89543 6 3 6C4.10457 6 5 6.89543 5 8C5 9.10457 4.10457 10 3 10Z" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 8L11 8" stroke="#9333EA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">One to One</span>
                    <p className="text-xs text-gray-500 text-center mt-1 px-1">
                      Each record links to exactly one related record
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={isLinksFieldEditing}
                  className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                    } ${relationType === 'has-many'
                      ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                    : 'text-[var(--color-text-primary)] border'
                    }`}
                  onClick={() => !isLinksFieldEditing && setRelationType('has-many')}
                  title="Each record in this table can link to multiple records in the target table"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path d="M3 10C4.10457 10 5 9.10457 5 8C5 6.89543 4.10457 6 3 6C1.89543 6 1 6.89543 1 8C1 9.10457 1.89543 10 3 10Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M13 10C14.1046 10 15 9.10457 15 8C15 6.89543 14.1046 6 13 6C11.8954 6 11 6.89543 11 8C11 9.10457 11.8954 10 13 10Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 15C10.1046 15 11 14.1046 11 13C11 11.8954 10.1046 11 9 11C7.89543 11 7 11.8954 7 13C7 14.1046 7.89543 15 9 15Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 5C10.1046 5 11 4.10457 11 3C11 1.89543 10.1046 1 9 1C7.89543 1 7 1.89543 7 3C7 4.10457 7.89543 5 9 5Z" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M11 8L5 8" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M7 4L5 6" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                          <path d="M7 12L5 10" stroke="#FA8231" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                        </g>
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Has Many</span>
                    <p className="text-xs text-gray-500 text-center mt-1 px-1">
                      One record can link to many related records
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={isLinksFieldEditing}
                  className={`p-3 rounded-xl border-2 transition-all ${isLinksFieldEditing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                    } ${relationType === 'many-to-many'
                      ? 'text-[var(--color-text-primary)] rounded-xl border-[var(--color-border-brand)]'
                    : 'text-[var(--color-text-primary)] border'
                    }`}
                  onClick={() => !isLinksFieldEditing && setRelationType('many-to-many')}
                  title="Records in both tables can link to multiple records in the other table"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="w-5 h-5" stroke="currentColor" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 6C2.89543 6 2 5.10457 2 4C2 2.89543 2.89543 2 4 2C5.10457 2 6 2.89543 6 4C6 5.10457 5.10457 6 4 6Z" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.5 10.5L10.5 5.5" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                        <path d="M5.5 5.5L10.5 10.5" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                        <path d="M6 4L10 4" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                        <path d="M6 12L10 12" stroke="#FC3AC6" strokeWidth="1.33333" strokeLinecap="square" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Many to Many</span>
                    <p className="text-xs text-gray-500 text-center mt-1 px-1">
                      Multiple records link to multiple related records
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Target Table</div>
              <AdvancedDropdown
                options={Array.isArray(tables) ? tables.map(table => ({
                  value: table.id,
                  label: table.title || table.alias || `Table ${table.id}`
                })) : []}
                value={selectedTableId}
                onChange={(value) => {
                  if (!isLinksFieldEditing) {
                  setSelectedTableId(value as string);
                  const table = Array.isArray(tables) ? tables.find(t => t.id === value) : null;
                  setSelectedTable(table);
                  }
                }}
                placeholder="Select table to link"
                searchable
                clearable
                disabled={isLinksFieldEditing}
              />
              {selectedTable && (
                <div className="mt-2 text-xs text-gray-500">
                  Linking to: <span className="font-medium">{selectedTable.title || selectedTable.alias}</span>
                </div>
              )}
              {selectedType.key === 'links' && !selectedTableId && (
                <div className="mt-1 text-xs text-red-500">
                  Target table is required for relation fields
                </div>
              )}
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'lookup':
        const relationOptions = linkFields.map(field => ({
          value: field.id,
          label: field.title || field.name || field.id
        }));

        const lookupColumnOptions = targetTableFields.map(field => ({
          value: field.id,
          label: field.title || field.column_name || field.id
        }));

        return (
          <>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                  Link Field
                </label>
                <AdvancedDropdown
                  options={relationOptions}
                  value={selectedRelationId}
                  onChange={(value) => setSelectedRelationId(value as string)}
                  placeholder="-select-"
                  searchable
                  clearable
                />
                {!selectedRelationId && linkFields.length === 0 && (
                  <div className="mt-1 text-xs text-orange-500">
                    No link fields found in this table. Create a link field first.
                  </div>
                )}
              </div>

              <div className="mb-4 w-full">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-2">
                  Lookup Field
                </label>
                <AdvancedDropdown
                  options={lookupColumnOptions}
                  value={selectedLookupColumnId}
                  onChange={(value) => setSelectedLookupColumnId(value as string)}
                  placeholder="-select-"
                  disabled={!selectedRelationId || isTargetTableLoading}
                  searchable
                  clearable
                />
                {selectedRelationId && isTargetTableLoading && (
                  <div className="mt-1 text-xs text-gray-500">Loading fields...</div>
                )}
                {selectedRelationId && !isTargetTableLoading && targetTableFields.length === 0 && (
                  <div className="mt-1 text-xs text-gray-500">No fields available</div>
                )}
              </div>
            </div>

            {selectedRelationId && selectedLookupColumnId && (
              <div className="mb-4 p-3 bg-gray-50 border rounded-xl">
                <div className="text-sm text-secondary">
                  This field will display the <span className="font-semibold">{targetTableFields.find(f => f.id === selectedLookupColumnId)?.title || selectedLookupColumnId} </span>
                  from the linked record via <span className="font-semibold">{linkFields.find(f => f.id === selectedRelationId)?.title || selectedRelationId}</span>
                </div>
              </div>
            )}

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description && (
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'button':
        return (
          <>
            {/* <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Button Configuration</div> */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Button Text</label>
              <input
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] text-[var(--color-text-secondary)] bg-[var(--color-alpha-white)] rounded text-sm focus:outline-none"
                placeholder="Enter button text"
                value={defaultValue}
                onChange={e => setDefaultValue(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Button Style</label>
              <Dropdown
                options={buttonStyleOptions}
                value={buttonStyle}
                onChange={(value) => setButtonStyle(value as string)}
                placeholder="Select button style"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Action</label>
              <Dropdown
                options={buttonActionOptions}
                value={buttonAction}
                onChange={(value) => setButtonAction(value as string)}
                placeholder="Select action"
              />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" className="checkbox-primary-brand" id="openInNewTab" checked={openButtonInNewTab} onChange={e => setOpenButtonInNewTab(e.target.checked)} />
              <label htmlFor="openInNewTab" className="text-sm text-[var(--color-gray-900)]">Open in new tab</label>
            </div>
            <div className="mb-3 relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </>
        );
      case 'json':
        return (
          <>
            <div className="mb-3">
              {/* <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Default JSON</label> */}
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowJsonDefault(v => !v)}>
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showJsonDefault && (
                <>
                  <JSONField
                    value={defaultValue}
                    onChange={handleJsonChange}
                    placeholder='{"key": "value"}'
                    isBorder={true}
                  />
                </>
              )}
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'createdBy':
        return (
          <>
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'lastModifiedBy':
        return (
          <>
            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      case 'formula':
        return (
          <>
              <Formula
                label="Formula"
                value={formulaText}
                config={{
                  formula: formulaText,
                  formatting: {
                    type: formulaFormatting.type,
                    precision: formulaFormatting.precision,
                    currency: formulaFormatting.currency,
                    dateFormat: formulaFormatting.dateFormat
                  }
                }}
                columns={fields.map(field => ({
                  id: field.id,
                  name: field.title || field.column_name || field.key,
                title: field.title || field.column_name || field.key,
                column_name: field.column_name,
                key: field.key || field.column_name,
                type: field.type || field.uidt,
                system: field.system || field.isSystem
                }))}
                onFormulaChange={(formula) => setFormulaText(formula)}
              onErrorChange={(error) => setFormulaError(error)}
                isBorder={true}
                allowEdit={true}
              helperText="Use {FieldName} to reference other fields."
              />
            <div className="relative mt-3">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <MultiLineText
                    placeholder="Enter field description..."
                    value={description}
                    onChange={value => setDescription(value)}
                    rows={4}
                    isBorder={true}
                  />
                  {description &&
                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                </>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div
      ref={modalRef}
      className={`${isAddNewField ? 'bg-modal-backdrop flex items-center justify-center'
        : `absolute top-full ${!isAddNewColumn || fields.length === 0 || fields.length <= 1 ? "left-0" : "right-0 translate-x-0"}`
        } z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
    >
      {/* {isAddNewField && (
        <div className="absolute bg-modal" onClick={onClose} />
      )} */}
      <div className={`relative bg-[var(--color-alpha-white)] min-h-[400px] max-h-[max(70vh,400px)] ${selectedType?.key === 'formula' ? 'w-[500px]' : 'w-[416px]'}  shadow-lg shadow-gray-300 border rounded-xl p-3.5 flex flex-col overflow-hidden`} >
        <div className="flex items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 flex-1">
            {initialValues ? 'Edit Field' : 'New Field'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
          {step === 1 && (
            <>
              <input
                ref={fieldNameInputRef}
                className={`w-full px-3 py-2 bg-[var(--color-alpha-white)] border border-[var(--color-border-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] text-[var(--text-color-primary)] placeholder:text-[var(--color-text-placeholder)] ${!nameError ? "mb-2" : ""}`}
                placeholder="Enter Field name"
                value={fieldName}
                // onChange={e => setFieldName(e.target.value)}
                onChange={e => {
                  const value = e?.target?.value;
                  const capitalized = value?.charAt(0)?.toUpperCase() + value?.slice(1);
                  setFieldName(capitalized);
                }}
              />
              {nameError && (
                <div className="text-red-500 text-xs mb-2 mt-1">{nameError}</div>
              )}
              <div className="mb-0">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    className="w-full pl-10 pr-3 py-2 text-sm text-[var(--text-color-primary)] border border-b-0 border-[var(--color-border-primary)] rounded-tl-lg rounded-tr-lg focus:outline-none bg-[var(--color-alpha-white)]"
                    placeholder="Search field type"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Scrollable area for filtered types */}
              {filteredTypes.length > 0 && (
                <div className={`max-h-[230px] p-2 space-y-1 overflow-y-auto rounded-bl-lg rounded-br-lg border bg-[var(--color-alpha-white)] text-[var(--text-color-tertiary)]`}>
                {filteredTypes.map((type: FieldType) => (
                  <button
                    key={type.key}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors ${selectedType?.key === type.key ? 'bg-blue-100' : ''}`}
                    onClick={() => handleTypeSelect(type)}
                    style={{ fontWeight: 500, fontSize: 14 }}
                  >
                    {(() => {
                      const IconComponent = type.icon;
                      return <IconComponent className="w-4 h-4 text-gray-400" />;
                    })()}
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
              )}
            </>
          )}

          {step === 2 && selectedType && (
            <>
              <input
                ref={fieldNameInputRef}
                className={`w-full px-3 py-2 bg-[var(--color-alpha-white)] border border-[var(--color-border-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] text-[var(--text-color-primary)] placeholder:text-[var(--color-text-placeholder)] ${!nameError ? "mb-2" : ""}`}
                placeholder="Enter Field name"
                value={fieldName}
                onChange={e => {
                  const value = e?.target?.value;
                  const capitalized = value?.charAt(0)?.toUpperCase() + value?.slice(1);
                  setFieldName(capitalized);
                }}
              // onChange={e => setFieldName(e.target.value)}
              />
              <div className={`text-red-500 text-xs mt-1 transition-all duration-300 ease-in-out ${nameError ? 'opacity-100 max-h-6 mb-2' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {nameError}
              </div>

              {/* Custom field type dropdown - preserves FIELD_TYPES order (not alphabetical) */}
              <div className="relative z-10 mb-2">
                <FieldTypeDropdown
                  fieldTypes={FIELD_TYPES.filter(type => !(type as any).hidden)}
                  selectedType={selectedType}
                  setSelectedType={handleTypeSelect}
                  disabled={selectedType?.key === 'lookup' || isFieldUsedInViews}
                />
                {isFieldUsedInViews && selectedType?.key !== 'links' && (
                  <div className="flex item-start gap-2 justify-between">
                    <span className="text-amber-600 mt-1"><Info className="w-4 h-4" /></span>
                    <p className="text-xs text-amber-600 flex items-center">
                      Field type cannot be changed because this field is used in one or more views. You can still update other properties like name, description, and configuration.
                    </p>
                  </div>
                )}
              </div>

              {/* Directly render the content without an extra div */}
              {renderConfigStep()}
            </>
          )}
        </div>

        {/* Buttons at the bottom */}
        <div className="mt-auto pt-3 flex gap-2">
          <button
            className="flex-1 px-4 py-2 rounded-xl border text-[var(--color-text-tertiary)] bg-[var(--color-alpha-white)] hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`flex-1 px-4 py-2 btn-primary !rounded-xl flex items-center justify-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Field'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

