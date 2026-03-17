// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/* eslint-disable sonarjs/cognitive-complexity */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, HelpCircle, X, Search, Plus } from "lucide-react";
import { FORMULA_FUNCTIONS, FREQUENTLY_USED_FUNCTION_NAMES } from '../../../utils/formulaConstants';
import {
  evaluateFormula,
  formatResult,
  formulaDependsOnRowData,
  formulaUsesToday,
  getFunctionSyntax,
  validateFormula,
  getFunctionAtCursor,
  getCompatibleFieldTypes,
  normalizeForComparison,
  convertResultToValue,
  type FormulaContext
} from '../../../utils/formulaHelper';

interface FormulaConfig {
  formula?: string;
  formatting?: {
    type?: 'number' | 'currency' | 'percent' | 'duration' | 'date' | 'text';
    precision?: number;
    currency?: string;
    dateFormat?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface FormulaProps {
  value?: string | number | boolean | null;
  onChange?: (value: string | number | boolean | null) => void;
  config?: FormulaConfig;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  columns?: any[]; // Available columns for formula
  onFormulaChange?: (formula: string) => void;
  onErrorChange?: (error: string | null) => void; // Notify parent of validation errors
  rowData?: Record<string, any>; // Actual row data for formula evaluation
  allColumns?: any[]; // All columns in the table (for field name mapping)
}

export const Formula: React.FC<FormulaProps> = ({
  value,
  onChange,
  config = {},
  disabled = false,
  isBorder = false,
  className = "",
  columns = [],
  onFormulaChange,
  onErrorChange,
  rowData,
  allColumns = []
}) => {
  const { formula = '', formatting = {} } = config;
  const [formulaText, setFormulaText] = useState(formula);
  const [formattingType, setFormattingType] = useState(formatting.type || 'text');
  const [precision, setPrecision] = useState(formatting.precision || 2);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [hasBlurred, setHasBlurred] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [showAllFunctions, setShowAllFunctions] = useState(false);
  const [allFunctionsModalPosition, setAllFunctionsModalPosition] = useState<{ top: number; left: number; height?: number } | null>(null);
  const [functionSearchQuery, setFunctionSearchQuery] = useState('');
  const [hoveredFunctionButton, setHoveredFunctionButton] = useState<string | null>(null);
  const [quickFunctionTooltipPosition, setQuickFunctionTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const quickFunctionButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const helpIconRef = useRef<HTMLSpanElement>(null);
  const showAllFunctionsButtonRef = useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const formulaChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasValidatedOnMountRef = useRef(false);
  const previousFormulaRef = useRef<string>(formula);
  const rowDataRef = useRef(rowData);
  const columnsRef = useRef(columns);
  const allColumnsRef = useRef(allColumns);
  const previousRowDataRef = useRef<string | null>(null);
  const evaluateAndNotifyRef = useRef<(() => void) | null>(null);
  const previousFormulaTextRef = useRef<string>(formulaText);
  const hasEvaluatedInitialRef = useRef(false);
  const lastNotifiedValueRef = useRef<any>(null); // Track last value we sent via onChange

  // Update refs when values change (so evaluateAndNotify can access latest without being a dependency)
  useEffect(() => {
    rowDataRef.current = rowData;
  }, [rowData]);

  // Update lastNotifiedValueRef when value prop changes from outside (e.g., from backend)
  // This ensures we don't keep comparing against stale values
  useEffect(() => {
    lastNotifiedValueRef.current = value;
  }, [value]);

  // Calculate tooltip position for fixed positioning to escape modal overflow
  const updateTooltipPosition = useCallback(() => {
    if (helpIconRef.current) {
      const rect = helpIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, []);

  // Update tooltip position on hover
  const handleHelpIconMouseEnter = useCallback(() => {
    updateTooltipPosition();
  }, [updateTooltipPosition]);

  const handleHelpIconMouseLeave = useCallback(() => {
    setTooltipPosition(null);
  }, []);

  // Update tooltip position on scroll/resize when tooltip is visible
  useEffect(() => {
    if (tooltipPosition) {
      const handleUpdate = () => {
        updateTooltipPosition();
      };
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [tooltipPosition, updateTooltipPosition]);

  // Calculate tooltip position for quick function buttons
  const updateQuickFunctionTooltipPosition = useCallback((functionName: string) => {
    const button = quickFunctionButtonRefs.current.get(functionName);
    if (button) {
      const rect = button.getBoundingClientRect();
      // Position tooltip centered above the button
      setQuickFunctionTooltipPosition({
        top: rect.top - 8, // 8px gap above button
        left: rect.left + rect.width / 2 // Center horizontally
      });
    }
  }, []);

  // Handle mouse enter on quick function button
  const handleQuickFunctionMouseEnter = useCallback((functionName: string) => {
    setHoveredFunctionButton(functionName);
    updateQuickFunctionTooltipPosition(functionName);
  }, [updateQuickFunctionTooltipPosition]);

  // Handle mouse leave on quick function button
  const handleQuickFunctionMouseLeave = useCallback(() => {
    setHoveredFunctionButton(null);
    setQuickFunctionTooltipPosition(null);
  }, []);

  // Update quick function tooltip position on scroll/resize when tooltip is visible
  useEffect(() => {
    if (hoveredFunctionButton && quickFunctionTooltipPosition) {
      const handleUpdate = () => {
        updateQuickFunctionTooltipPosition(hoveredFunctionButton);
      };
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [hoveredFunctionButton, quickFunctionTooltipPosition, updateQuickFunctionTooltipPosition]);

  // Calculate all functions modal position - align with NewColumnModal on the right
  const updateAllFunctionsModalPosition = useCallback(() => {
    if (showAllFunctionsButtonRef.current) {
      // Find the NewColumnModal element - traverse up from the button to find the modal container
      let currentElement: HTMLElement | null = showAllFunctionsButtonRef.current;
      let newColumnModal: Element | null = null;

      // Traverse up the DOM tree to find the modal
      while (currentElement && !newColumnModal) {
        currentElement = currentElement.parentElement;
        if (currentElement) {
          const classes = currentElement.className || '';
          // Check for NewColumnModal specific classes - more specific matching
          if ((classes.includes('min-h-[400px]') && classes.includes('max-h-[max(70vh,400px)]')) ||
            classes.includes('w-[500px]') ||
            classes.includes('w-[416px]') ||
            (classes.includes('bg-[var(--color-alpha-white)]') && classes.includes('shadow-lg') && classes.includes('border'))) {
            const rect = currentElement.getBoundingClientRect();
            // Verify it's a modal (has reasonable dimensions and is visible)
            if (rect.width > 300 && rect.height > 300 && rect.top >= 0 && rect.left >= 0) {
              newColumnModal = currentElement;
              break;
            }
          }
        }
      }

      // Alternative: search all modals and find the one closest to our button
      if (!newColumnModal) {
        // More specific selector for NewColumnModal - also check for header text
        const allModals = document.querySelectorAll('[class*="min-h-[400px]"], [class*="w-[500px]"], [class*="w-[416px]"]');
        const buttonRect = showAllFunctionsButtonRef.current.getBoundingClientRect();
        let closestModal: Element | null = null;
        let closestDistance = Infinity;

        for (const modal of allModals) {
          const rect = modal.getBoundingClientRect();
          // More strict validation - modal should be visible and reasonably sized
          if (rect.width > 300 && rect.height > 300 && rect.top >= 0 && rect.left >= 0) {
            // Check if this modal contains "Edit Field" or "New Field" text (more reliable)
            const modalText = modal.textContent || '';
            const isNewColumnModal = modalText.includes('Edit Field') ||
              modalText.includes('New Field') ||
              modalText.includes('Save Field');

            // Calculate distance from button to modal
            const modalCenterX = rect.left + rect.width / 2;
            const modalCenterY = rect.top + rect.height / 2;
            const buttonCenterX = buttonRect.left + buttonRect.width / 2;
            const buttonCenterY = buttonRect.top + buttonRect.height / 2;
            const distance = Math.sqrt(
              Math.pow(modalCenterX - buttonCenterX, 2) +
              Math.pow(modalCenterY - buttonCenterY, 2)
            );

            // Prefer modals with matching text, but still consider distance
            const adjustedDistance = isNewColumnModal ? distance * 0.5 : distance;
            if (adjustedDistance < closestDistance) {
              closestDistance = adjustedDistance;
              closestModal = modal;
            }
          }
        }
        newColumnModal = closestModal;
      }

      if (newColumnModal) {
        const modalRect = newColumnModal.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const functionsModalWidth = 350; // Match the actual width in the JSX (w-[350px])
        const gap = 0; // No gap - make it look like an extension

        // Always position to the right of NewColumnModal, aligned exactly at the top
        let leftPosition = modalRect.right + gap;

        // If not enough space on right, adjust to fit but keep it on the right side
        if (leftPosition + functionsModalWidth > viewportWidth - 20) {
          // Adjust left position to fit within viewport, but still try to be on the right
          leftPosition = Math.max(20, viewportWidth - functionsModalWidth - 20);
        }

        // Match the top position exactly and height of NewColumnModal
        const topPosition = modalRect.top;
        const modalHeight = modalRect.height; // Use actual height of NewColumnModal

        setAllFunctionsModalPosition({
          top: topPosition,
          left: leftPosition,
          height: modalHeight
        });
      } else {
        // Fallback: position relative to button, always on the right
        const rect = showAllFunctionsButtonRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const functionsModalWidth = 350;
        const gap = 8;

        let leftPosition = rect.right + gap;
        // If not enough space, adjust but keep on right side
        if (leftPosition + functionsModalWidth > viewportWidth - 20) {
          leftPosition = Math.max(20, viewportWidth - functionsModalWidth - 20);
        }

        const topPosition = Math.max(20, rect.top - 100);
        const modalHeight = Math.max(window.innerHeight * 0.7, 400);

        setAllFunctionsModalPosition({
          top: topPosition,
          left: leftPosition,
          height: modalHeight
        });
      }
    }
  }, []);

  // Update modal position on scroll/resize when modal is visible
  useEffect(() => {
    if (showAllFunctions) {
      updateAllFunctionsModalPosition();

      const handleUpdate = () => {
        updateAllFunctionsModalPosition();
      };

      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [showAllFunctions, updateAllFunctionsModalPosition]);

  // Close modal when clicking outside
  useEffect(() => {
    if (showAllFunctions) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          showAllFunctionsButtonRef.current &&
          !showAllFunctionsButtonRef.current.contains(target) &&
          !target.closest('.all-functions-modal')
        ) {
          setShowAllFunctions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAllFunctions]);

  const handleShowAllFunctionsClick = useCallback(() => {
    setShowAllFunctions(!showAllFunctions);
    if (showAllFunctions) {
      // Reset search when closing modal
      setFunctionSearchQuery('');
    } else {
      // Use requestAnimationFrame to ensure DOM is ready, then update position
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateAllFunctionsModalPosition();
        }, 0);
      });
    }
  }, [showAllFunctions, updateAllFunctionsModalPosition]);

  // Reset search query and selected function when modal closes
  useEffect(() => {
    if (!showAllFunctions) {
      setFunctionSearchQuery('');
      setSelectedFunction(null);
    }
  }, [showAllFunctions]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    allColumnsRef.current = allColumns;
  }, [allColumns]);

  // Sync formula text with config changes
  useEffect(() => {
    if (formula && formula !== formulaText) {
      setFormulaText(formula);
    }
  }, [formula]);

  // Sync formatting with config changes
  useEffect(() => {
    if (formatting.type && formatting.type !== formattingType) {
      setFormattingType(formatting.type);
    }
    if (formatting.precision !== undefined && formatting.precision !== precision) {
      setPrecision(formatting.precision);
    }
  }, [formatting]);

  // Create context object for helper functions
  const formulaContext: FormulaContext = useMemo(() => ({
    columns,
    allColumns,
    rowData
  }), [columns, allColumns, rowData]);

  // Validate on mount if formula exists (show errors on first render)
  // Also validate when columns become available (they might load after mount)
  // Only validate once when columns become available, not on every formulaText change
  // Validation on blur is handled in handleBlur - this ensures text functions are validated on blur like math functions
  useEffect(() => {
    // Only validate once when columns become available and we have a formula
    // This handles the initial load case, but subsequent changes are validated on blur
    if (formulaText.trim() && (columns.length > 0 || allColumns.length > 0) && !hasValidatedOnMountRef.current) {
      const error = validateFormula(formulaText, formulaContext);
      setFormulaError(error);
      onErrorChange?.(error);
      hasValidatedOnMountRef.current = true;
    }
  }, [columns, allColumns, formulaText, formulaContext]); // Only run when columns change, not on formulaText change - validation on blur handles text changes

  // Validate when formula prop changes (if not blurred yet)
  useEffect(() => {
    // Only validate if formula prop changed and we haven't blurred yet
    if (formula !== previousFormulaRef.current && !hasBlurred) {
      // Use the formula prop directly since formulaText might not be synced yet
      const formulaToValidate = formula || formulaText;
      if (formulaToValidate.trim()) {
        const error = validateFormula(formulaToValidate, formulaContext);
        setFormulaError(error);
        onErrorChange?.(error);
      }
    }
    previousFormulaRef.current = formula;
  }, [formula, hasBlurred, onErrorChange, formulaText, formulaContext]);

  // Notify parent when error changes
  useEffect(() => {
    onErrorChange?.(formulaError);
  }, [formulaError, onErrorChange]);

  // Initial evaluation when rowData becomes available for the first time
  // This ensures formula fields calculate their initial value when data is loaded
  useEffect(() => {
    // Evaluate once when we first get rowData and have a formula
    // This ensures formula fields calculate their initial value
    if (formulaText.trim() && rowData && !hasEvaluatedInitialRef.current && evaluateAndNotifyRef.current) {
      hasEvaluatedInitialRef.current = true;
      // Small delay to ensure all refs are set and evaluateAndNotify is ready
      const timer = setTimeout(() => {
        if (evaluateAndNotifyRef.current) {
          evaluateAndNotifyRef.current();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formulaText, rowData]); // Run when formulaText or rowData becomes available

  // All evaluation functions are now imported from formulaHelper.ts
  // Using evaluateFormulaLocal wrapper that provides context to the imported functions

  // Consolidated evaluation and notification function
  // Handles both formulas that depend on rowData/TODAY() and those that don't
  // Uses utility functions from formulaHelper to avoid code duplication
  const evaluateAndNotify = useCallback(() => {
    if (!onChange) return;

    // Evaluate the formula - it will use latest rowData, columns, allColumns from closure
    const { result, error } = evaluateFormula(formulaText, formulaContext, validateFormula);

    if (!error && result !== null && result !== undefined) {
      // Convert result to value using utility function
      const newValue = convertResultToValue(result, formattingType);

      // Normalize values for comparison to prevent unnecessary onChange calls
      const normalizedNew = normalizeForComparison(newValue);
      const normalizedCurrent = normalizeForComparison(value);
      const normalizedLastNotified = normalizeForComparison(lastNotifiedValueRef.current);

      // Only call onChange if value actually changed from both current value AND last notified value
      // This prevents infinite loops when rowData updates but formula result stays the same
      if (normalizedNew !== normalizedCurrent && normalizedNew !== normalizedLastNotified) {
        lastNotifiedValueRef.current = newValue;
        onChange(newValue);
      }
    } else if (value !== null && value !== undefined) {
      // If formula is invalid or empty, only pass null if current value is not null
      lastNotifiedValueRef.current = null;
      onChange(null);
    }
    // Only depend on formulaText, onChange, formattingType, and value
    // rowData, columns, allColumns are accessed from closure and will be latest values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulaText, onChange, formattingType, value]);

  // Store in ref for use in other effects
  useEffect(() => {
    evaluateAndNotifyRef.current = evaluateAndNotify;
  }, [evaluateAndNotify]);

  // Update formula when text changes (debounced to prevent flickering)
  useEffect(() => {
    // Only proceed if formulaText actually changed
    if (previousFormulaTextRef.current === formulaText) {
      return;
    }

    // Update ref
    previousFormulaTextRef.current = formulaText;

    // Clear previous timeout
    if (formulaChangeTimeoutRef.current) {
      clearTimeout(formulaChangeTimeoutRef.current);
    }

    // Debounce the callback to prevent excessive re-renders
    formulaChangeTimeoutRef.current = setTimeout(() => {
      onFormulaChange?.(formulaText);
      evaluateAndNotify();
    }, 300);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (formulaChangeTimeoutRef.current) {
        clearTimeout(formulaChangeTimeoutRef.current);
      }
    };
  }, [formulaText, onFormulaChange, evaluateAndNotify]);

  // Re-evaluate when rowData changes, if formula depends on rowData OR uses TODAY()
  // TODAY() should update when data is updated (rowData changes)
  // NOW() does NOT update when rowData changes - it's evaluated once when the formula is first evaluated
  useEffect(() => {
    // Check if rowData actually changed (not just reference)
    const currentRowDataString = rowData ? JSON.stringify(rowData) : null;
    const previousRowDataString = previousRowDataRef.current;

    // Only proceed if rowData actually changed
    if (currentRowDataString === previousRowDataString) {
      // Update ref but don't re-evaluate
      previousRowDataRef.current = currentRowDataString;
      return;
    }

    // Update ref with new rowData
    previousRowDataRef.current = currentRowDataString;

    // Re-evaluate if formula contains field references OR uses TODAY()
    // Use current formulaText from state, not from dependencies
    // Note: NOW() is excluded - it doesn't update when rowData changes
    if (formulaDependsOnRowData(formulaText) || formulaUsesToday(formulaText)) {
      // Clear previous timeout
      if (formulaChangeTimeoutRef.current) {
        clearTimeout(formulaChangeTimeoutRef.current);
      }

      // Debounce to prevent excessive re-renders
      formulaChangeTimeoutRef.current = setTimeout(() => {
        // Use ref to get latest callback without adding it as dependency
        if (evaluateAndNotifyRef.current) {
          evaluateAndNotifyRef.current();
        }
      }, 300);

      return () => {
        if (formulaChangeTimeoutRef.current) {
          clearTimeout(formulaChangeTimeoutRef.current);
        }
      };
    }
    // Only depend on rowData - formulaText is checked inside, evaluateAndNotify is from ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData]);

  // Calculate cursor position in textarea
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;

    // Get text before cursor
    const textBeforeCursor = formulaText.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentLineText = lines[currentLine] || '';

    // Create a temporary div to measure text dimensions
    const div = document.createElement('div');
    const style = getComputedStyle(textarea);

    // Copy relevant textarea styles
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.overflowWrap = 'break-word';
    div.style.fontFamily = style.fontFamily;
    div.style.fontSize = style.fontSize;
    div.style.fontWeight = style.fontWeight;
    div.style.fontStyle = style.fontStyle;
    div.style.letterSpacing = style.letterSpacing;
    div.style.paddingLeft = style.paddingLeft;
    div.style.paddingRight = style.paddingRight;
    div.style.paddingTop = style.paddingTop;
    div.style.paddingBottom = style.paddingBottom;
    div.style.borderLeftWidth = style.borderLeftWidth;
    div.style.borderRightWidth = style.borderRightWidth;
    div.style.borderTopWidth = style.borderTopWidth;
    div.style.borderBottomWidth = style.borderBottomWidth;
    div.style.boxSizing = style.boxSizing;
    div.style.width = `${textarea.offsetWidth}px`;

    // Create a span to measure the actual text width
    const span = document.createElement('span');
    span.textContent = currentLineText || '\u200b'; // Use zero-width space if empty
    div.appendChild(span);

    document.body.appendChild(div);

    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;

    // Calculate cursor position with small offset below cursor
    const top = textareaRect.top + (currentLine + 1) * lineHeight - textarea.scrollTop + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.borderTopWidth) + 4;
    const left = textareaRect.left + spanRect.width + Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.borderLeftWidth);

    div.remove();

    setCursorPosition({ top, left });
  }, [formulaText]);

  // Check if cursor is inside a field reference (between { and })
  const isInsideFieldReference = useCallback((): boolean => {
    if (!textareaRef.current) return false;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = formulaText.substring(0, cursorPos);

    // Find the last '{' before cursor
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
    if (lastOpenBrace === -1) return false;

    // Check if there's a closing '}' between the last '{' and cursor
    const hasClosingBrace = textBeforeCursor.substring(lastOpenBrace + 1).includes('}');

    // If we're inside a field reference (after { but before })
    return !hasClosingBrace;
  }, [formulaText]);

  // Handle focus on textarea
  const handleFocus = () => {
    setIsTextareaFocused(true);
    updateCursorPosition();
    // Check if we should show dropdown on focus
    if (isInsideFieldReference()) {
      setShowFieldDropdown(true);
      updateCursorPosition();
    }
  };

  // Handle validation on blur
  // This ensures text functions are validated on blur, same as math functions
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Don't blur if clicking on the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.field-dropdown')) {
      return;
    }

    setHasBlurred(true);
    setIsTextareaFocused(false);
    setShowFieldDropdown(false);
    setCursorPosition(null);

    // Clear any pending debounced callback
    if (formulaChangeTimeoutRef.current) {
      clearTimeout(formulaChangeTimeoutRef.current);
      formulaChangeTimeoutRef.current = null;
    }

    // Immediately call onFormulaChange to ensure latest value is saved (for formula definition)
    onFormulaChange?.(formulaText);

    // Validate formula (includes both math and text function validation)
    const error = validateFormula(formulaText, formulaContext);
    setFormulaError(error);
    onErrorChange?.(error); // Notify parent of validation error

    // Call onChange with the evaluated result, not the formula string
    // This is needed for record modals to save the calculated value to rowData
    if (onChange) {
      // Evaluate the formula and pass the result
      const { result, error: evalError } = evaluateFormula(formulaText, formulaContext, validateFormula);
      if (!evalError && result !== null && result !== undefined) {
        // Use utility function to convert result to value
        const newValue = convertResultToValue(result, formattingType);
        onChange(newValue);
      } else {
        // If formula is invalid or empty, pass null
        onChange(null);
      }
    }
  };

  const insertFunction = (functionName: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formulaText;

    // Strip any existing parentheses from function name (func.name might be "ADD()")
    const baseFunctionName = functionName.replaceAll(/\(\)$/g, '');
    // Insert function name with parentheses
    const functionWithParens = baseFunctionName + "()";
    const newText = text.substring(0, start) + functionWithParens + text.substring(end);
    setFormulaText(newText);

    // Set cursor position inside the parentheses (after the opening parenthesis)
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + baseFunctionName.length + 1, start + baseFunctionName.length + 1);
    }, 0);
  };

  const insertColumn = (columnName: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formulaText;

    // Check if we're inside a field reference (after {)
    const textBeforeCursor = text.substring(0, start);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace === -1) {
      // Insert column reference with curly braces
      const columnReference = `{${columnName}}`;
      const newText = text.substring(0, start) + columnReference + text.substring(end);
      setFormulaText(newText);

      // Set cursor position after the inserted column reference
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + columnReference.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        updateCursorPosition();
        setShowFieldDropdown(false);
      }, 0);
    } else {
      // We're inside a field reference, replace from { to cursor with {FieldName}
      // Check if there's already a closing brace after cursor
      const textAfterCursor = text.substring(end);
      const hasClosingBrace = textAfterCursor.startsWith('}');

      let newText: string;
      if (hasClosingBrace) {
        // Replace content between { and }
        newText = text.substring(0, lastOpenBrace + 1) + columnName + text.substring(end);
      } else {
        // Add field name and closing brace
        newText = text.substring(0, lastOpenBrace + 1) + columnName + '}' + text.substring(end);
      }
      setFormulaText(newText);

      // Set cursor position after the field name (after closing })
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastOpenBrace + 1 + columnName.length + (hasClosingBrace ? 0 : 1);
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        updateCursorPosition();
        setShowFieldDropdown(false);
      }, 0);
    }
  };

  const toggleCategory = (category: string) => {
    // Only allow one accordion to be open at a time
    if (expandedCategories.has(category)) {
      // If clicking on an already open category, close it
      setExpandedCategories(new Set());
    } else {
      // Open the clicked category and close all others
      setExpandedCategories(new Set([category]));
    }
  };

  const toggleFunction = (functionKey: string) => {
    // Only allow one function accordion to be open at a time
    if (expandedFunctions.has(functionKey)) {
      // If clicking on an already open function, close it
      setExpandedFunctions(new Set());
    } else {
      // Open the clicked function and close all others
      setExpandedFunctions(new Set([functionKey]));
    }
  };

  const handleClear = () => {
    setFormulaText('');
    setFormulaError(null);
    onErrorChange?.(null);
    onFormulaChange?.('');
    onChange?.(null);
    // Focus the textarea after clearing
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };



  // Compute frequently used functions
  const frequentlyUsedFunctions = useMemo(() => {
    const functions: Array<{ name: string; description: string; example: string }> = [];
    Object.values(FORMULA_FUNCTIONS).forEach((funcList) => {
      funcList.forEach((func) => {
        const funcName = func.name.replaceAll(/[()]/g, '');
        if (FREQUENTLY_USED_FUNCTION_NAMES.includes(funcName)) {
          functions.push(func);
        }
      });
    });
    return functions;
  }, []);

  // Filter functions based on search query
  const filteredFormulaFunctions = useMemo(() => {
    if (!functionSearchQuery.trim()) {
      return FORMULA_FUNCTIONS;
    }

    const query = functionSearchQuery.toLowerCase().trim();
    const filtered: Record<string, Array<{ name: string; description: string; example: string }>> = {};

    Object.entries(FORMULA_FUNCTIONS).forEach(([category, functions]) => {
      const matchingFunctions = functions.filter((func) => {
        const funcName = func.name.replaceAll(/[()]/g, '').toLowerCase();
        const description = (func.description || '').toLowerCase();
        return funcName.includes(query) || description.includes(query);
      });

      if (matchingFunctions.length > 0) {
        filtered[category] = matchingFunctions;
      }
    });

    return filtered;
  }, [functionSearchQuery]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (functionSearchQuery.trim()) {
      const categoriesToExpand = new Set<string>();
      Object.keys(filteredFormulaFunctions).forEach((category) => {
        categoriesToExpand.add(category);
      });
      setExpandedCategories(categoriesToExpand);
    } else {
      setExpandedCategories(new Set());
    }
  }, [functionSearchQuery, filteredFormulaFunctions]);

  // Get filtered columns based on current function at cursor
  const filteredColumns = useMemo(() => {
    if (!textareaRef.current || !isTextareaFocused) {
      // If not focused, return all columns (filtered by system/formula only)
      return columns.filter((column) => {
        const isSystem = column.isSystem || column.system;
        const isFormula = column.type === 'formula' || column.uidt === 'formula' || column.uidt === 'Formula';
        return !isSystem && !isFormula;
      });
    }

    const cursorPos = textareaRef.current.selectionStart;
    const functionName = getFunctionAtCursor(formulaText, cursorPos);
    const compatibleTypes = getCompatibleFieldTypes(functionName);

    return columns.filter((column) => {
      // Filter out system fields
      const isSystem = column.isSystem || column.system;
      // Filter out formula fields
      const isFormula = column.type === 'formula' || column.uidt === 'formula' || column.uidt === 'Formula';

      if (isSystem || isFormula) {
        return false;
      }

      // If we have compatible types, filter by them
      if (compatibleTypes) {
        const columnType = (column.type || column.uidt || '').toLowerCase();
        return compatibleTypes.includes(columnType);
      }

      // If no compatible types (null), show all fields
      return true;
    });
  }, [columns, formulaText, isTextareaFocused]);

  // If disabled (read-only mode), show calculated value
  if (disabled) {
    const { result, error } = evaluateFormula(formulaText, formulaContext, validateFormula);

    if (error) {
      return null;
    }

    if (result === null) {
      return null;
    }

    return <div className={`${className} px-2 truncate`}>{formatResult(result, formattingType, precision, config, formulaText)}</div>;
  }

  return (
    <div className={`relative w-full ${className}`}>


      <div className="space-y-2.5">
        {/* Error Display - Show on first render if error exists, or after blur */}
        {formulaError && (
          <div className="text-xs text-red-600">
            {formulaError}
          </div>
        )}

        {/* Functions and Formula - Formula always on top */}
        <div className="flex flex-col gap-2.5">
          {/* Formula Input - Top/Left Side */}
          <div className="flex-1 mb-0 flex flex-col">
            <div className="flex items-center justify-between w-full">
              <label className="field-component-label flex items-center gap-2">
                <span>Formula</span>
                <span //NOSONAR
                  ref={helpIconRef}
                  className="relative inline-block"
                  onMouseEnter={handleHelpIconMouseEnter}
                  onMouseLeave={handleHelpIconMouseLeave}
                >
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  {tooltipPosition && createPortal(
                    <div
                      className="fixed w-80 bg-card border rounded-xl shadow-lg p-4 text-sm z-[10000]"
                      style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px` }}
                    >
                      <h4 className="mb-3 text-primary font-semibold">How to use formulas:</h4>

                      <ul className="space-y-2 text-gray-600">
                        <li className="pb-2 border-b border-primary">• Use <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">{'{FieldName}'}</span> to refer to other fields — always wrap names in curly brackets and note that they're case-sensitive.</li>
                        <li className="pb-2 border-b border-primary">• You can click any function to add it and combine it with operators like <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">+</span>, <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">-</span>, <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">*</span>, or <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">/</span>.</li>
                        <li className="pb-2 border-b border-primary">• Make sure the field type matches the function: math needs numbers, text needs text, and date functions need date/time fields.</li>
                        <li>• For plain text, use quotes — for example: <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">"Hello"</span> or <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--color-utility-bg)] text-gray-700 text-xs font-mono font-semibold">"World"</span>.</li>
                      </ul>
                    </div>,
                    document.body
                  )}
                </span>
              </label>
              {formulaText && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                  aria-label="Clear formula"
                  title="Clear formula"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-2 relative">
              <textarea
                ref={textareaRef}
                value={formulaText}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const cursorPos = e.target.selectionStart;

                  // Check if '{' was just typed
                  const textBeforeCursor = newValue.substring(0, cursorPos);
                  const lastChar = textBeforeCursor[cursorPos - 1];

                  if (lastChar === '{') {
                    // Show dropdown when '{' is typed
                    setShowFieldDropdown(true);
                    setFormulaText(newValue);
                    // Update cursor position after state update
                    setTimeout(() => {
                      updateCursorPosition();
                    }, 0);
                  } else if (lastChar === '}') {
                    // Hide dropdown when '}' is typed
                    setShowFieldDropdown(false);
                    setFormulaText(newValue);
                  } else {
                    setFormulaText(newValue);
                    // Check if we're still inside a field reference
                    const textBeforeNewCursor = newValue.substring(0, cursorPos);
                    const lastOpenBrace = textBeforeNewCursor.lastIndexOf('{');
                    if (lastOpenBrace === -1) {
                      setShowFieldDropdown(false);
                    } else {
                      const textAfterOpenBrace = textBeforeNewCursor.substring(lastOpenBrace + 1);
                      const hasClosingBrace = textAfterOpenBrace.includes('}');
                      setShowFieldDropdown(!hasClosingBrace);
                      // Update cursor position to keep dropdown aligned
                      setTimeout(() => {
                        updateCursorPosition();
                      }, 0);
                    }
                  }

                  // Clear error when user starts typing (after blur) - validation will happen on blur
                  if (hasBlurred && formulaError) {
                    setFormulaError(null);
                    onErrorChange?.(null);
                  }
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onClick={() => {
                  updateCursorPosition();
                  // Check if we should show dropdown on click
                  if (isInsideFieldReference()) {
                    setShowFieldDropdown(true);
                  } else {
                    setShowFieldDropdown(false);
                  }
                }}
                onKeyUp={(e) => {
                  updateCursorPosition();
                  // Check if we should show dropdown on key up
                  if (isInsideFieldReference()) {
                    setShowFieldDropdown(true);
                  } else if (e.key === '}') {
                    setShowFieldDropdown(false);
                  }
                }}
                onKeyDown={(e) => {
                  updateCursorPosition();
                  // Handle Escape key to close dropdown
                  if (e.key === 'Escape') {
                    setShowFieldDropdown(false);
                  }
                }}
                onMouseUp={updateCursorPosition}
                placeholder="Enter formula (e.g., ADD({Price}, {Tax})"
                className={`w-full field-component p-2.5 resize-none !h-[75px] ${formulaError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'field-component-focus'
                  } ${isBorder ? "field-component-border" : ""} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                rows={3}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Frequently Used Functions - Compact button grid */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="field-component-label text-sm">Quick Functions</span>
              <button
                ref={showAllFunctionsButtonRef}
                onClick={handleShowAllFunctionsClick}
                className="px-2.5 py-1 text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] hover:bg-gray-50 rounded transition-colors"
                aria-label="View all functions"
                title="View all functions"
              >
                All functions →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {frequentlyUsedFunctions.map((func) => {
                const functionName = func.name.replaceAll(/[()]/g, '');
                const fullDescription = func.description || '';
                const example = func.example || '';

                return (
                  <div key={func.name} className="relative">
                    <button
                      ref={(el) => {
                        if (el) {
                          quickFunctionButtonRefs.current.set(func.name, el);
                        } else {
                          quickFunctionButtonRefs.current.delete(func.name);
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        insertFunction(func.name);
                      }}
                      onMouseEnter={() => handleQuickFunctionMouseEnter(func.name)}
                      onMouseLeave={handleQuickFunctionMouseLeave}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl focus:outline-none bg-card text-tertiary border-border"
                    >
                      {functionName}
                    </button>
                    {hoveredFunctionButton === func.name && quickFunctionTooltipPosition && createPortal(
                      <div
                        className="fixed z-[10000] bg-card rounded-xl shadow-lg px-3 py-2.5 text-sm max-w-xs"
                        style={{
                          top: `${quickFunctionTooltipPosition.top}px`,
                          left: `${quickFunctionTooltipPosition.left}px`,
                          transform: 'translateX(-50%) translateY(calc(-100% - 8px))'
                        }}
                      >
                        {/* Tooltip pointer */}
                        <div
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid white',
                            filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                        {/* Tooltip content */}
                        <div className="relative z-10">
                          {fullDescription && (
                            <div className="text-primary mb-2">
                              {fullDescription}
                            </div>
                          )}
                          {example && (
                            <div className="bg-gray-50 px-2 mb-2 font-mono rounded-xl text-gray-500 mt-1">
                              Example: <span className="font-mono text-gray-700">{example}</span>
                            </div>
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Select Field - Dropdown below cursor when '{' is typed */}
        {showFieldDropdown && isTextareaFocused && filteredColumns.length > 0 && cursorPosition && createPortal(
          <div //NOSONAR
            className="field-dropdown fixed z-[10000] bg-white dark:bg-[var(--color-utility-bg)] shadow-lg rounded-xl border min-w-[150px] max-w-[200px] max-h-[200px] overflow-hidden"
            style={{
              top: `${cursorPosition.top}px`,
              left: `${cursorPosition.left}px`
            }}
            onMouseDown={(e) => {
              // Prevent textarea from losing focus when clicking dropdown
              e.preventDefault();
            }}
          >

            <div className="overflow-y-auto max-h-[160px]">
              <div className="px-1 py-1">
                {filteredColumns.map((column) => {
                  const displayName = column.title || column.name || column.column_name || column.id;
                  return (
                    <button
                      key={column.id}
                      onClick={() => {
                        insertColumn(displayName);
                        // Hide dropdown after selection
                        setShowFieldDropdown(false);
                        // Keep focus on textarea and update cursor position
                        setTimeout(() => {
                          textareaRef.current?.focus();
                          updateCursorPosition();
                        }, 0);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded transition-colors"
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* All Functions Modal - Fixed position, aligned with NewColumnModal */}
        {showAllFunctions && allFunctionsModalPosition && createPortal(
          <div //NOSONAR
            className="all-functions-modal fixed z-[10000] bg-[var(--color-alpha-white)] shadow-lg border rounded-xl w-[350px] overflow-hidden flex flex-col"
            style={{
              top: `${allFunctionsModalPosition.top}px`,
              left: `${allFunctionsModalPosition.left}px`,
              height: allFunctionsModalPosition.height ? `${allFunctionsModalPosition.height}px` : `${Math.max(window.innerHeight * 0.7, 400)}px`,
              maxHeight: allFunctionsModalPosition.height ? `${allFunctionsModalPosition.height}px` : `${Math.max(window.innerHeight * 0.7, 400)}px`
            }}
            onMouseDown={(e) => {
              // Prevent textarea from losing focus when clicking modal
              e.preventDefault();
            }}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Functions & Operators</h3>
                <button
                  onClick={() => setShowAllFunctions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search functions..."
                  value={functionSearchQuery}
                  onChange={(e) => setFunctionSearchQuery(e.target.value)}
                  className="w-full field-component !pl-9 !pr-3 !py-2 field-component-focus field-component-border"
                  autoFocus
                />
                {functionSearchQuery && (
                  <button
                    onClick={() => setFunctionSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content - Single scroll area */}
            <div className="overflow-y-auto flex-1 bg-[var(--color-alpha-white)]">
              {Object.keys(filteredFormulaFunctions).length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No functions found matching "{functionSearchQuery}"
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {Object.entries(filteredFormulaFunctions).map(([category, functions]) => (
                    <div key={category}>
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors ${expandedCategories.has(category)
                            ? "text-gray-900 bg-gray-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                          }`}
                      >
                        <span className="truncate">
                          {(() => {
                            const trimmedCategory = category.trim();
                            const functionsSuffix = " Functions";
                            const operatorsSuffix = " Operators";
                            if (trimmedCategory.endsWith(functionsSuffix)) {
                              return trimmedCategory.slice(0, -functionsSuffix.length);
                            }
                            if (trimmedCategory.endsWith(operatorsSuffix)) {
                              return trimmedCategory.slice(0, -operatorsSuffix.length);
                            }
                            return trimmedCategory;
                          })()}
                        </span>
                        {expandedCategories.has(category) ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {expandedCategories.has(category) && (
                        <div className="px-4 py-2 space-y-1.5">
                          {functions.map((func) => {
                            const functionKey = `${category}-${func.name}`;
                            const isExpanded = expandedFunctions.has(functionKey);
                            return (
                              <div key={func.name} className="group">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedFunction(functionKey);
                                      insertFunction(func.name);
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded-xl flex items-center gap-2 ${selectedFunction === functionKey ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold ' : 'text-primary'} truncate`}
                                    title={func.description || func.name}
                                  >
                                    {func.name.replaceAll(/[()]/g, '')}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      insertFunction(func.name);
                                    }}
                                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors text-gray-400 hover:text-[var(--color-brand-600)] hover:bg-gray-100"
                                    aria-label="Insert function"
                                    title="Insert function"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFunction(functionKey);
                                    }}
                                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded
                                        ? "bg-gray-200 text-gray-700"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                      }`}
                                    aria-label="Toggle function details"
                                    title="Show details"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                  </button>
                                </div>
                                {isExpanded && (
                                  <div className="mt-1.5 ml-0.5 pl-2.5 py-2 text-xs border-l-2 dark:bg-[var(--color-hover-bg)]">
                                    {func.description && (
                                      <div className="text-gray-600 mb-2 leading-relaxed text-xs">{func.description}</div>
                                    )}
                                    <div className="space-y-1.5">
                                      <div>
                                        <span className="text-gray-500">Syntax: </span>
                                        <code className="text-gray-800 font-mono bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                                          {getFunctionSyntax(func.name, func.example || '')}
                                        </code>
                                      </div>
                                      {func.example && (
                                        <div>
                                          <span className="text-gray-500">Example: </span>
                                          <code className="text-gray-800 font-mono bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                                            {func.example}
                                          </code>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
