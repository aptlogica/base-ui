// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Info, Loader2 } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { FIELD_TYPES } from '../../types/fieldTypes';
import {
  timeZoneOptions,
} from '../../types/constants';
import { FieldTypeDropdown } from '../common/dropdown/fieldDropdown/FieldTypeDropdown';
import { useBaseTables, useTable, useAllViews } from '../../hooks/useApi';
import { useNavigationStore } from '../../stores/navigationStore';
import { useToast } from '../../components/common/Toast';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../utils/fieldUsageUtils';
import { renderNewColumnConfigStep } from './NewColumnModalConfigStep';
import { buildColumnPayload, buildFieldMeta, getUniqueColumnNameByUidt, isDuplicateFieldName } from './NewColumnModal.logic';
import { validateFormula } from '../../utils/formulaHelper';

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
  useBackdrop?: boolean;
  excludeRefs?: React.RefObject<HTMLElement | null>[];
  currentTableId?: string; // Add current table ID to exclude from target selection
}

const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const resolveCheckboxDefault = (config: any) => {
  if (config.checkboxDefault !== undefined) {
    return !!config.checkboxDefault;
  }
  if (config.defaultValue !== undefined) {
    return !!config.defaultValue;
  }
  return false;
};

const resolveTimeZoneLabel = (config: any) => {
  if (config.timeZoneLabel) return config.timeZoneLabel;
  if (!config.timeZone) return '';
  return timeZoneOptions.find((o: any) => o.value === config.timeZone)?.label || '';
};

const getRawTables = (tablesData: any) => {
  if (Array.isArray(tablesData)) return tablesData;
  if (Array.isArray(tablesData?.data)) return tablesData.data;
  return [];
};

const isFieldTypeLocked = (
  isFieldUsedInViews: boolean,
  isLinksFieldEditing: boolean,
  selectedTypeKey: string | undefined,
  selectedRelationId: string
) => isFieldUsedInViews || isLinksFieldEditing || (selectedTypeKey === 'lookup' && !!selectedRelationId);

export function NewColumnModal({ isOpen, onClose, onSave, initialValues, fields = [], isAddNewColumn = false, isAddNewField = false, useBackdrop, excludeRefs = [], currentTableId }: Readonly<NewColumnModalProps>) {
  const [step, setStep] = useState<number | null>(initialValues ? 2 : 1);
  const [fieldName, setFieldName] = useState(initialValues?.title || '');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType | null>(
    initialValues ? FIELD_TYPES.find(type => type.key === initialValues.type) || null : null
  );

  const toast = useToast();
  // Get current base ID and tables for relations
  const { selectedBaseId } = useNavigationStore();
  const { data: tablesData } = useBaseTables(selectedBaseId || '') as { data?: any };
  // Get all views for field usage validation (fallback)
  const { data: allViews = [] } = useAllViews();

  // Get fresh table data with views (preferred source)
  const { data: tableData } = useTable(currentTableId || '') as { data?: { views?: any[] } };
  const currentTablePayload = useMemo(() => (tableData as any)?.data || tableData || null, [tableData]);

  // Prefer tableData.views (fresh) over allViews (cached)
  // Filter views to only include views from the current table
  const currentTableViews = useMemo(() => {
    // First try to use fresh views from tableData
    if (currentTableId && currentTablePayload?.views && Array.isArray(currentTablePayload.views)) {
      return currentTablePayload.views;
    }

    // Fallback to filtered allViews
    if (currentTableId && allViews && allViews.length > 0) {
      const filtered = allViews.filter((view: any) =>
        String(view.model_id || view.modelId || '') === String(currentTableId)
      );
      return filtered;
    }

    return [];
  }, [currentTablePayload, allViews, currentTableId]);

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
    if (!tablesData) return [];

    // Handle both shapes:
    // 1) direct array
    // 2) StandardResponse => { data: [...] }
    const rawTables = getRawTables(tablesData);

    // Extract model objects when present, otherwise use table item directly.
    return rawTables
      .map((item: any) => item?.model || item)
      .filter((table: any) => !!table?.id)
      .filter((table: any) => table.id !== currentTableId); // Exclude current table from target selection
  }, [tablesData, currentTableId]);

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

  // Add state for percent and duration configs
  const [displayAsProgress, setDisplayAsProgress] = useState(false);
  const [progressColor, setProgressColor] = useState('blue');
  const [showPercentDefault, setShowPercentDefault] = useState(false);
  const [percentDefault, setPercentDefault] = useState<number | null>(null);
  const [durationFormat, setDurationFormat] = useState('h:mm');
  const [showDurationDefault, setShowDurationDefault] = useState(false);
  const [durationDefault, setDurationDefault] = useState(0);

  const isValidPercentInput = (input: string) => {
    if (input === '' || input === '.') return true;
    let seenDot = false;
    for (const element of input) {
      const ch = element;
      if (ch === '.') {
        if (seenDot) return false;
        seenDot = true;
        continue;
      }
      if (ch < '0' || ch > '9') return false;
    }
    return true;
  };

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
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showRatingIconDropdown, setShowRatingIconDropdown] = useState(false);
  const [showRatingColorDropdown, setShowRatingColorDropdown] = useState(false);

  // Add state for json field config
  const [showJsonDefault, setShowJsonDefault] = useState(false);

  const applyNumberConfig = (config: any) => {
    setShowThousands(config.showThousands || false);
    setPrecision(config.precision || '1.0');
  };

  const applyTextConfig = (config: any) => {
    setRichText(config.richText || false);
  };

  const applySelectConfig = (config: any, isSingle: boolean) => {
    setSelectOptions(config.options || []);
    if (isSingle) {
      setSingleDefault(config.defaultValue || '');
    } else {
      setMultiDefault(config.defaultValue || []);
    }
  };

  const applyBooleanConfig = (config: any) => {
    setCheckboxIcon(config.checkboxIcon || config.icon || 'check');
    setCheckboxColor(config.checkboxColor || config.color || 'green');
    setCheckboxDefault(resolveCheckboxDefault(config));
  };

  const applyFormulaConfig = (config: any) => {
    setFormulaText(config.formula || '');
    setFormulaFormatting(config.formatting || {
      type: 'text' as 'number' | 'currency' | 'percent' | 'duration' | 'date' | 'text',
      precision: 2,
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD'
    });
  };

  const applyUserConfig = (config: any) => {
    setAllowMultipleUsers(config.allowMultiple || false);
  };

  const applyInitialConfig = (values: any) => {
    if (!values) return;
    setDescription(values.description || '');
    const config = values.config;
    if (!config) return;

    const fieldType = values.type;
    const handlers: Record<string, () => void> = {
      number: () => applyNumberConfig(config),
      decimal: () => applyNumberConfig(config),
      text: () => applyTextConfig(config),
      select: () => applySelectConfig(config, true),
      multiSelect: () => applySelectConfig(config, false),
      boolean: () => applyBooleanConfig(config),
      formula: () => applyFormulaConfig(config),
      user: () => applyUserConfig(config),
    };

    handlers[fieldType]?.();
  };

  // Add click outside handlers for dropdowns
  useEffect(() => {
    // Initialize configuration values when in edit mode
    applyInitialConfig(initialValues);
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
  const [hasUserModifiedLookupColumn, setHasUserModifiedLookupColumn] = useState(false);
  const [targetTableFields, setTargetTableFields] = useState<any[]>([]);

  // Get all links type fields from current table
  const linkFields = useMemo(() => {
    return (fields || []).filter(field => field.type === 'links' || field.uidt === 'links');
  }, [fields]);

  const getRelationIdFromLinkField = (field: any): string => {
    return (
      field?.meta?.relation_id ||
      field?.config?.relation_id ||
      field?.meta?.relation?.id ||
      field?.config?.relation?.id ||
      field?.relation_id ||
      ''
    );
  };

  const getTargetTableIdFromLinkField = (field: any): string => {
    return (
      field?.meta?.relation?.with ||
      field?.config?.relation?.with ||
      field?.meta?.relation?.with_model_id ||
      field?.config?.relation?.with_model_id ||
      field?.meta?.relation?.table_id ||
      field?.config?.relation?.table_id ||
      ''
    );
  };

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
          const fieldRelationId = getRelationIdFromLinkField(field);
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

  const targetTableId = useMemo(() => getTargetTableIdFromLinkField(selectedRelation), [selectedRelation]);

  // Fetch target table data to get its fields (only if we have a valid table ID)
  const { data: targetData, isLoading: isTargetTableLoading } = useTable(targetTableId) as { data?: { columns?: any[] }; isLoading: boolean };
  const targetTablePayload = useMemo(() => (targetData as any)?.data || targetData || null, [targetData]);

  // Extract fields from target table
  useEffect(() => {
    if (!targetTableId || !targetData) {
      setTargetTableFields([]);
      return;
    }

    if (targetTablePayload?.columns && Array.isArray(targetTablePayload.columns)) {
      // Filter out links, rollup, and lookup fields
      // Exclude system fields BUT keep 'title' as it's important for lookups
      const filteredFields = targetTablePayload.columns.filter((col: any) =>
        col.uidt !== 'links' &&
        col.uidt !== 'rollup' &&
        col.uidt !== 'lookup' &&
        (!col.system || col.uidt === 'text' || col.column_name === 'title')
      );
      setTargetTableFields(filteredFields);

      // If editing a lookup field and we have the lookup column ID, ensure it's set
      if (initialValues?.type === 'lookup' && isOpen && !hasUserModifiedLookupColumn) {
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
  }, [targetTablePayload, targetTableId, initialValues, isOpen, selectedLookupColumnId, hasUserModifiedLookupColumn]);

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
      setSelectedLookupColumnId('');
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
  const [longtextModalRef, setLongtextModalRef] = useState<React.RefObject<HTMLDivElement> | null>(null);
  const modalRef = useClickOutside({
    isOpen,
    onClose,
    excludeRefs: longtextModalRef ? [...excludeRefs, longtextModalRef] : excludeRefs
  });

  const resolveStringDefault = (
    fieldType: string,
    targetType: string,
    defaultValue: string | undefined,
    fallbackValue: string | undefined,
    emptyFallback: string
  ) => {
    if (fieldType === targetType) {
      return defaultValue || fallbackValue || emptyFallback;
    }
    return fallbackValue || emptyFallback;
  };

  const resolveNullableDefault = <T,>(
    fieldType: string,
    targetType: string,
    defaultValue: T | undefined,
    fallbackValue: T | undefined,
    emptyFallback: T
  ) => {
    if (fieldType === targetType) {
      return defaultValue ?? fallbackValue ?? emptyFallback;
    }
    return fallbackValue ?? emptyFallback;
  };

  const initializeEditState = (values: any) => {
    setStep(2);
    setFieldName(values.title || '');
    // Try both type (normalized) and uidt (original from API) for field type matching
    setSelectedType(FIELD_TYPES.find(t => t.key === values.type || t.key === values.uidt) || null);

    // Get config from meta or config property
    // API response structure: column.meta.defaultValue -> becomes config.defaultValue here
    const config = values.meta || values.config || {};
    // Use both type (normalized) and uidt (original from API) for field type
    const fieldType = values.type || values.uidt;

    // defaultValue is always in config.defaultValue (from meta.defaultValue in API response)
    // initialValues.defaultValue doesn't exist at top level - it's nested in meta/config
    setDefaultValue(config.defaultValue || '');
    setDescription(values.description || '');
    setRichText(!!config.richText);
    setShowThousands(!!config.showThousands);
    setPrecision(config.precision || '1.0');
    // Boolean/checkbox fields: check both saved format (icon/color/defaultValue) and state format (checkboxIcon/checkboxColor/checkboxDefault)
    setCheckboxIcon(config.checkboxIcon || config.icon || 'check');
    setCheckboxColor(config.checkboxColor || config.color || 'green');
    setCheckboxDefault(resolveCheckboxDefault(config));
    setSelectOptions(
      (config.options || config.selectOptions || []).map((o: any) =>
        typeof o === 'string' ? { option: o, color: '' } : { option: o.option, color: o.color || '' }
      )
    );
    // Load default values based on field type - check defaultValue first (where it's saved), then fallback to type-specific keys
    let resolvedMultiDefault = config.multiDefault || [];
    if (fieldType === 'multiSelect') {
      resolvedMultiDefault = Array.isArray(config.defaultValue)
        ? config.defaultValue
        : (config.multiDefault || []);
    }
    setMultiDefault(resolvedMultiDefault);

    let resolvedSingleDefault = config.singleDefault || '';
    if (fieldType === 'select') {
      resolvedSingleDefault = typeof config.defaultValue === 'string' && config.defaultValue
        ? config.defaultValue
        : (config.singleDefault || '');
    }
    setSingleDefault(resolvedSingleDefault);
    setRatingIcon(config.ratingIcon || 'star');
    setRatingColor(config.ratingColor || 'yellow');
    setRatingMax(config.ratingMax || 5);
    setRatingDefault(config.ratingDefault || 0);
    setDateFormat(config.dateFormat || 'YYYY-MM-DD');
    setTimeFormat(config.timeFormat || 'hh:mm');
    setHourFormat(config.hourFormat || '24');
    setDisplayTimeZone(!!config.displayTimeZone);
    setSameTimezone(!!config.sameTimezone);
    setTimeZone(resolveTimeZoneLabel(config));
    // For datetime: check defaultValue first (where it's saved), then fallback to dateTimeDefault
    setDateTimeDefault(resolveStringDefault(fieldType, 'datetime', config.defaultValue, config.dateTimeDefault, ''));
    setShowDateTimeDefault(false);
    // For year: check defaultValue first (where it's saved), then fallback to yearDefault
    setYearDefault(resolveNullableDefault(fieldType, 'year', config.defaultValue, config.yearDefault, null));
    // For date: check defaultValue first (where it's saved), then fallback to dateDefault
    setDateDefault(resolveStringDefault(fieldType, 'date', config.defaultValue, config.dateDefault, ''));
    setShowDateDefault(false);
    // For time: check defaultValue first (where it's saved), then fallback to timeDefault
    setTimeDefault(resolveStringDefault(fieldType, 'time', config.defaultValue, config.timeDefault, ''));
    setShowTimeDefault(false);
    setPhoneValid(!!config.phoneValid);
    // For phone: check defaultValue first (where it's saved), then fallback to phoneDefault
    setPhoneDefault(resolveStringDefault(fieldType, 'phoneNumber', config.defaultValue, config.phoneDefault, ''));
    setShowPhoneDefault(false);
    setEmailValid(!!config.emailValid);
    // For email: check defaultValue first (where it's saved), then fallback to emailDefault
    setEmailDefault(resolveStringDefault(fieldType, 'email', config.defaultValue, config.emailDefault, ''));
    setShowEmailDefault(false);
    setUrlValid(!!config.urlValid);
    // For url: check defaultValue first (where it's saved), then fallback to urlDefault
    setUrlDefault(resolveStringDefault(fieldType, 'url', config.defaultValue, config.urlDefault, ''));
    setShowUrlDefault(false);

    // Note: Lookup field initialization is handled in a separate useEffect
    // that runs when linkFields become available (see above)
    setDisplayAsProgress(!!config.displayAsProgress);
    setShowPercentDefault(false);
    // For percent: check defaultValue first (where it's saved), then fallback to percentDefault
    setPercentDefault(resolveNullableDefault(fieldType, 'percent', config.defaultValue, config.percentDefault, null));
    setDurationFormat(config.durationFormat || 'h:mm');
    // For duration: check defaultValue first (where it's saved), then fallback to durationDefault
    setDurationDefault(resolveNullableDefault(fieldType, 'duration', config.defaultValue, config.durationDefault, 0));
    setCurrencyType(config.currencyType || 'USD');
    setCurrencyLocale(config.currencyLocale || 'en-US');
    // For currency: check defaultValue first (where it's saved), then fallback to currencyDefault
    setCurrencyDefault(resolveNullableDefault(fieldType, 'currency', config.defaultValue, config.currencyDefault, null));
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
    setSearch('');
  };

  const initializeCreateState = () => {
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
    // Reset user field config state
    setAllowMultipleUsers(false);
    // Reset links field config state
    setRelationType('one-to-one');
    setSelectedTableId('');
    setSelectedTable(null);
    // Reset lookup field config state
    setSelectedRelationId('');
    setSelectedLookupColumnId('');
    setHasUserModifiedLookupColumn(false);
    setTargetTableFields([]);
    // Reset button field config state
    setButtonStyle('primary');
    setButtonAction('url');
    setOpenButtonInNewTab(true);
    // Reset json field config state
    // Reset createdBy/lastModifiedBy field config state
  };

  const resetStateOnClose = () => {
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
    setAllowMultipleUsers(false);
    setRelationType('one-to-one');
    setSelectedTableId('');
    setSelectedTable(null);
    setSelectedRelationId('');
    setSelectedLookupColumnId('');
    setHasUserModifiedLookupColumn(false);
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
  };

  //select, multi-select input state - track which option is being edited
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState<string>('');

  // Longtext modal handlers
  const handleLongtextModalOpen = (modalRef: React.RefObject<HTMLDivElement>) => {
    setLongtextModalRef(modalRef);
  };

  const handleLongtextModalClose = () => {
    setLongtextModalRef(null);
  };
  const [optionError, setOptionError] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUserModifiedLookupColumn(false);
      if (initialValues) {
        initializeEditState(initialValues);
      } else {
        initializeCreateState();
      }
      setNameError(null);
      setFormulaError(null);
    } else {
      resetStateOnClose();
    }
  }, [isOpen, initialValues]);

  // Debounced check for duplicate field name (step 1 only)
  useEffect(() => {
    if (step !== 1) return;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const currentId = initialValues?.id || initialValues?.key;
      const isDuplicate = isDuplicateFieldName({
        fieldName,
        fields,
        currentId
      });
      if (fieldName.trim() && isDuplicate) {
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

  // Check if we're editing a links field (scoped here for use in dropdown)
  const isLinksFieldEditing = initialValues && (initialValues.type === 'links' || initialValues.uidt === 'links');

  const getOptionColor = () => {
    // Generate a random hex color
    const randomColor = `#${(crypto.getRandomValues(new Uint32Array(1))[0] & 0xffffff)
      .toString(16)
      .padStart(6, '0')
      }`;
    return randomColor;
  };

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

    // If fieldName is empty, generate a unique name using uidt
    let finalFieldName = fieldName?.trim();
    if (!finalFieldName) {
      const uidtBase = selectedType?.key || 'Field';
      finalFieldName = getUniqueColumnNameByUidt(uidtBase, fields);
      setFieldName(finalFieldName); // Optionally update the UI as well
    }

    const currentId = initialValues?.id || initialValues?.key;
    const isDuplicate = isDuplicateFieldName({
      fieldName,
      fields,
      currentId
    });
    if (isDuplicate) {
      setNameError('Field name already exists');
      return;
    }

    if (selectedType?.key === 'formula') {
      const trimmedFormula = formulaText.trim();
      if (trimmedFormula) {
        const formulaColumns = fields.map((field: any) => ({
          id: field.id,
          name: field.title || field.column_name || field.key,
          title: field.title || field.column_name || field.key,
          column_name: field.column_name,
          key: field.key || field.column_name,
          type: field.type || field.uidt,
          uidt: field.uidt || field.type,
        }));

        const validationError = validateFormula(trimmedFormula, {
          columns: formulaColumns,
          allColumns: [],
          rowData: {}
        });

        setFormulaError(validationError);
        if (validationError) {
          return;
        }
      } else if (formulaError) {
        setFormulaError(null);
      }
    }

    if (!selectedType) {
      return;
    }

    const { meta, error } = buildFieldMeta({
      selectedTypeKey: selectedType.key,
      defaultValue,
      richText,
      showThousands,
      precision,
      checkboxIcon,
      checkboxColor,
      checkboxDefault,
      selectOptions,
      singleDefault,
      multiDefault,
      ratingIcon,
      ratingColor,
      ratingMax,
      ratingDefault,
      description,
      dateFormat,
      timeFormat,
      hourFormat,
      displayTimeZone,
      sameTimezone,
      timeZone,
      timeZoneOptions,
      dateTimeDefault,
      currencyType,
      currencyLocale,
      currencyDefault,
      displayAsProgress,
      progressColor,
      percentDefault,
      durationFormat,
      durationDefault,
      yearDefault,
      dateDefault,
      timeDefault,
      phoneValid,
      phoneDefault,
      emailValid,
      emailDefault,
      urlValid,
      urlDefault,
      allowMultipleUsers,
      selectedUsers,
      selectedTableId,
      selectedTable,
      relationType,
      selectedRelationId,
      selectedLookupColumnId,
      linkFields,
      buttonStyle,
      buttonAction,
      openButtonInNewTab,
      formulaText,
      formulaFormatting,
      getBrowserTimeZone
    });

    if (error) {
      toast.error(error);
      return;
    }

    const colConfig = buildColumnPayload({
      fieldName,
      selectedTypeKey: selectedType.key,
      description,
      fields,
      initialValues,
      meta
    });

    setIsSaving(true);
    onSave(colConfig);
    // Don't reset state here - let the parent component close the modal
    // State will be reset when the modal closes via useEffect
  };

  if (!isOpen) return null;

  const renderConfigStep = () => renderNewColumnConfigStep({
    selectedType,
    defaultValue,
    setDefaultValue,
    description,
    setDescription,
    richText,
    setRichText,
    showThousands,
    setShowThousands,
    precision,
    setPrecision,
    checkboxIcon,
    setCheckboxIcon,
    checkboxColor,
    setCheckboxColor,
    checkboxDefault,
    setCheckboxDefault,
    selectOptions,
    setSelectOptions,
    color,
    setColor,
    newOption,
    setNewOption,
    multiDefault,
    setMultiDefault,
    singleDefault,
    setSingleDefault,
    editingOptionIndex,
    setEditingOptionIndex,
    editingOptionValue,
    setEditingOptionValue,
    optionError,
    setOptionError,
    dateFormat,
    setDateFormat,
    dateDefault,
    setDateDefault,
    showDateDefault,
    setShowDateDefault,
    yearDefault,
    setYearDefault,
    showYearDefault,
    setShowYearDefault,
    timeFormat,
    setTimeFormat,
    timeDefault,
    setTimeDefault,
    showTimeDefault,
    setShowTimeDefault,
    hourFormat,
    setHourFormat,
    displayTimeZone,
    setDisplayTimeZone,
    sameTimezone,
    setSameTimezone,
    timeZone,
    setTimeZone,
    dateTimeDefault,
    setDateTimeDefault,
    showDateTimeDefault,
    setShowDateTimeDefault,
    phoneValid,
    setPhoneValid,
    phoneDefault,
    setPhoneDefault,
    showPhoneDefault,
    setShowPhoneDefault,
    emailValid,
    setEmailValid,
    emailDefault,
    setEmailDefault,
    showEmailDefault,
    setShowEmailDefault,
    urlValid,
    setUrlValid,
    urlDefault,
    setUrlDefault,
    showUrlDefault,
    setShowUrlDefault,
    displayAsProgress,
    setDisplayAsProgress,
    progressColor,
    setProgressColor,
    showPercentDefault,
    setShowPercentDefault,
    percentDefault,
    setPercentDefault,
    durationFormat,
    setDurationFormat,
    showDurationDefault,
    setShowDurationDefault,
    durationDefault,
    setDurationDefault,
    currencyType,
    setCurrencyType,
    currencyLocale,
    setCurrencyLocale,
    showCurrencyDefault,
    setShowCurrencyDefault,
    currencyDefault,
    setCurrencyDefault,
    ratingIcon,
    setRatingIcon,
    ratingColor,
    setRatingColor,
    ratingMax,
    setRatingMax,
    ratingDefault,
    setRatingDefault,
    showRatingDefault,
    setShowRatingDefault,
    ratingDefaultHover,
    setRatingDefaultHover,
    allowMultipleUsers,
    setAllowMultipleUsers,
    showUserDefault,
    setShowUserDefault,
    selectedUsers,
    setSelectedUsers,
    relationType,
    setRelationType,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    setSelectedTable,
    selectedRelationId,
    setSelectedRelationId,
    selectedLookupColumnId,
    setSelectedLookupColumnId,
    setHasUserModifiedLookupColumn,
    buttonStyle,
    setButtonStyle,
    buttonAction,
    setButtonAction,
    openButtonInNewTab,
    setOpenButtonInNewTab,
    formulaText,
    setFormulaText,
    formulaFormatting,
    formulaError,
    setFormulaFormatting,
    showJsonDefault,
    setShowJsonDefault,
    showTextDefault,
    setShowTextDefault,
    showDescription,
    setShowDescription,
    showIconDropdown,
    setShowIconDropdown,
    showColorDropdown,
    setShowColorDropdown,
    showRatingIconDropdown,
    setShowRatingIconDropdown,
    showRatingColorDropdown,
    setShowRatingColorDropdown,
    fields,
    tables,
    linkFields,
    targetTableFields,
    isTargetTableLoading,
    getOptionColor,
    editInputRef,
    handleLongtextModalOpen,
    handleLongtextModalClose,
    setFormulaError,
    isValidPercentInput,
    isLinksFieldEditing,
  });
  const isCompactAnchor = !isAddNewColumn || fields.length === 0 || fields.length <= 1;
  const positionClass = isCompactAnchor ? "left-0" : "right-0 translate-x-0";
  const shouldUseBackdrop = useBackdrop ?? isAddNewField;
  const modalAnchorClass = shouldUseBackdrop ? 'bg-modal-backdrop flex items-center justify-center' : `absolute top-full ${positionClass}`;
  const modalWidthClass = selectedType?.key === 'formula' ? 'w-[500px]' : 'w-[416px]';

  return (
    <div
      ref={modalRef}
      className={`${modalAnchorClass} z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
    >
      <div className={`relative bg-[var(--color-alpha-white)] min-h-[400px] max-h-[max(70vh,400px)] ${modalWidthClass}  shadow-lg shadow-gray-300 border rounded-xl p-3.5 flex flex-col overflow-hidden`} >
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
                className={`w-full px-3 py-2 bg-[var(--color-alpha-white)] border border-[var(--color-border-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] text-[var(--text-color-primary)] placeholder:text-[var(--color-text-placeholder)] ${nameError ? "" : "mb-2"}`}
                placeholder="Enter Field name"
                value={fieldName}
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
                    className="w-full pl-10 pr-3 py-2 text-sm text-[var(--text-color-primary)] border rounded-tl-lg rounded-tr-lg focus:outline-none bg-[var(--color-alpha-white)]"
                    placeholder="Search field type"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Scrollable area for filtered types */}
              {filteredTypes.length > 0 && (
                <div className={`max-h-[230px] p-2 space-y-1 overflow-y-auto rounded-bl-lg border-t-0 rounded-br-lg border bg-[var(--color-alpha-white)] text-[var(--text-color-tertiary)]`}>
                  {filteredTypes.map((type: FieldType) => (
                    <button
                      key={type.key}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors ${selectedType?.key === type.key ? 'bg-blue-100' : ''}`}
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
                className={`w-full px-3 py-2 bg-[var(--color-alpha-white)] border border-[var(--color-border-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] text-[var(--text-color-primary)] placeholder:text-[var(--color-text-placeholder)] ${nameError ? "" : "mb-2"}`}
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
                  disabled={isFieldTypeLocked(isFieldUsedInViews, isLinksFieldEditing, selectedType?.key, selectedRelationId)}
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
            className="flex-1 px-16 py-2 rounded-xl border text-[var(--color-text-tertiary)] bg-[var(--color-alpha-white)] hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`flex-1 px-16 py-2 btn-primary !rounded-xl flex items-center justify-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
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


