import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, Plus, Search, X, ChevronDown } from 'lucide-react';
import { useTable, useInsertRelationData } from '../../../hooks/useApi';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useToast } from '../../common/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useFrontendPagination } from '../../../hooks/useFrontendPagination';
import { Loader } from '../../ui/Loader';
import { formatCompactNumber } from '../../../utils/helpers';

interface LinksFieldProps {
    value?: any;
    onChange?: (value: any) => void;
    field: {
        id: string;
        title: string;
        meta?: {
            relation?: {
                with: string;
                type: 'one-to-one' | 'has-many' | 'many-to-many';
            };
        };
    };
    disabled?: boolean;
    placeholder?: string;
    currentRowId?: number;
    currentTableId?: string;
    persistImmediately?: boolean;
    isBorder?: boolean;
}

interface RelatedRecord {
    id: string;
    [key: string]: any;
}

export const LinksField: React.FC<LinksFieldProps> = ({
    value,
    onChange,
    field,
    disabled = false,
    placeholder = 'Search records to link...',
    currentRowId,
    currentTableId,
    persistImmediately = true, // Default to true for backward compatibility
    isBorder = false // Default to false for backward compatibility
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; position: 'above' | 'below' } | null>(null);
    const [focusedRecordIndex, setFocusedRecordIndex] = useState<number>(-1);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const recordsListRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useClickOutside({
        isOpen,
        onClose: () => {
            setIsOpen(false);
            setDropdownPosition(null);
            // Reset search when closing
            setSearchTerm('');
            setFocusedRecordIndex(-1);
        },
        excludeRefs: [dropdownRef, searchRef, triggerRef]
    });

    // Calculate dropdown position with smart positioning (above/below)
    const calculateDropdownPosition = useCallback(() => {
        if (!triggerRef.current) return null;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownMinHeight = 200; // Minimum height estimate for dropdown content
        const dropdownWidth = 384; // w-96 = 384px

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Determine if we should open above or below
        let position: 'above' | 'below' = 'below';
        if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
            position = 'above';
        }

        // Calculate left position (align to right edge of trigger)
        let left = rect.right - dropdownWidth;
        if (left < 10) {
            left = 10; // 10px margin from left edge
        }
        if (left + dropdownWidth > viewportWidth - 10) {
            left = viewportWidth - dropdownWidth - 10; // 10px margin from right edge
        }

        return {
            top: position === 'below' ? rect.bottom + 4 : undefined,
            bottom: position === 'above' ? window.innerHeight - rect.top : undefined,
            left,
            width: dropdownWidth,
            position
        };
    }, []);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const position = calculateDropdownPosition();
            setDropdownPosition(position);
        } else {
            setDropdownPosition(null);
        }
    }, [isOpen, calculateDropdownPosition]);

    // Get relation info from field meta
    const targetTableId = field?.meta?.relation?.with;
    const relationType = field?.meta?.relation?.type || 'one-to-one';

    const { data: tableData, isLoading: isTableLoading } = useTable(targetTableId || '');
    const insertRelationMutation = useInsertRelationData();

    const records = useMemo(() => {
        const data = tableData as { data?: { records?: any[] } } | null | undefined;
        if (!data?.data?.records || !Array.isArray(data.data.records)) {
            return [];
        }
        return data.data.records.map((record: any) => ({
            id: record.id.toString(),
            ...record
        }));
    }, [tableData]);


    const selectedRecords = useMemo(() => {
        // Handle empty objects, null, undefined, or empty arrays
        if (!value ||
            (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) ||
            (Array.isArray(value) && value.length === 0)) {
            return [];
        }

        // Normalize value to array of IDs
        const valueIds = Array.isArray(value)
            ? value.map(item => {
                if (typeof item === 'object' && item.id) {
                    return item.id.toString();
                }
                return item.toString();
            })
            : [typeof value === 'object' && value.id ? value.id.toString() : value.toString()];

        // If we have records loaded, try to match them
        if (records.length > 0) {
            const matchedRecords: RelatedRecord[] = [];

            for (const id of valueIds) {
                const foundRecord = records.find((r: RelatedRecord) => r.id === id);
                if (foundRecord) {
                    matchedRecords.push(foundRecord);
                } else {
                    // Try to find by string comparison as well
                    const foundByString = records.find((r: RelatedRecord) => r.id.toString() === id.toString());
                    if (foundByString) {
                        matchedRecords.push(foundByString);
                    } else {
                        // Create a placeholder with the ID
                        matchedRecords.push({
                            id,
                            title: `Record ${id}`,
                            _isPlaceholder: true
                        });
                    }
                }
            }

            return matchedRecords;
        }

        // If no records loaded yet, create placeholders
        return valueIds.map(id => ({
            id,
            title: 'Loading...',
            _isPlaceholder: true
        }));
    }, [value, records, isTableLoading]);

    // Filter records based on debounced search term
    const filteredRecords = useMemo(() => {
        if (!debouncedSearchTerm.trim()) return records;

        return records.filter((record: RelatedRecord) => {
            const searchableFields = ['title', 'name', 'first_name', 'last_name', 'description'];
            return searchableFields.some(fieldName => {
                const fieldValue = record[fieldName];
                return fieldValue?.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            });
        });
    }, [records, debouncedSearchTerm]);

    // FRONTEND PAGINATION: Paginate filtered records for better performance
    const {
        allLoadedData: paginatedRecords,
        loadNextPage,
        hasMore,
        totalItems,
    } = useFrontendPagination<RelatedRecord>({
        data: filteredRecords,
        pageSize: 30, // Same as GridView, Kanban, Gallery, and Calendar
        initialPage: 1,
    });

    // Infinite scroll: Load more records when user scrolls near bottom
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !hasMore || isLoadingMore) return;

        const handleScroll = () => {
            // Clear any pending scroll handler
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Debounce scroll handler to prevent multiple rapid calls
            scrollTimeoutRef.current = setTimeout(() => {
                const { scrollTop, scrollHeight, clientHeight } = container;
                // Load more when user is within 100px of bottom
                if (scrollHeight - scrollTop <= clientHeight + 100 && !isLoadingMore) {
                    setIsLoadingMore(true);
                    loadNextPage();
                    // loadNextPage is synchronous, so reset loading state after a brief delay
                    setTimeout(() => setIsLoadingMore(false), 100);
                }
            }, 150); // Debounce scroll events
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [hasMore, loadNextPage, isLoadingMore]);

    // Handle manual "Load more" button click
    const handleLoadMore = useCallback(() => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        loadNextPage();
        // loadNextPage is synchronous, so reset loading state after a brief delay
        setTimeout(() => setIsLoadingMore(false), 100);
    }, [isLoadingMore, hasMore, loadNextPage]);

    // Common persist logic
    const persistRelation = useCallback(async (recordId: string, action: 'link' | 'unlink') => {
        if (!currentRowId || !currentTableId) return false;

        try {
            setLoadingRecordId(recordId);
            await insertRelationMutation.mutateAsync({
                model_id: currentTableId,
                column_id: field.id,
                source_row_id: currentRowId,
                target_row_id: Number.parseInt(recordId, 10),
                action,
                target_table_id: targetTableId // Pass target table ID for cache invalidation
            });
            return true;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update relation';
            toast.error(errorMessage);
            return false;
        } finally {
            setLoadingRecordId(null);
        }
    }, [currentRowId, currentTableId, field.id, insertRelationMutation, toast, targetTableId]);

    const handleSelectRecord = useCallback(async (record: RelatedRecord) => {
        if (disabled) return;

        const isAlreadySelected = selectedRecords.some(r => r.id === record.id);
        const action = isAlreadySelected ? 'unlink' : 'link';

        if (persistImmediately) {
            // Optimistically update the UI immediately
            // Preserve the original value format (IDs or objects)
            const currentValue = Array.isArray(value) ? value : [];
            const optimisticValue = isAlreadySelected
                ? currentValue.filter((v: any) => {
                    const vId = typeof v === 'object' && v?.id ? v.id.toString() : v?.toString();
                    return vId !== record.id.toString();
                })
                : [...currentValue, record]; // Add the full record object

            // Update via onChange to trigger UI update immediately
            if (onChange) {
                onChange(optimisticValue);
            }

            const success = await persistRelation(record.id, action);
            if (success) {
                toast.success(isAlreadySelected ? 'Record unlinked successfully' : 'Record linked successfully');
                // Force refetch to ensure data is in sync with server
                if (currentTableId) {
                    queryClient.refetchQueries({
                        queryKey: ['tables', String(currentTableId)],
                        type: 'active'
                    });
                }
            } else {
                // Revert optimistic update on failure
                if (onChange) {
                    onChange(value);
                }
            }
        } else {
            // Update local state only (for form view)
            const newSelectedRecords = isAlreadySelected
                ? selectedRecords.filter(r => r.id !== record.id)
                : [...selectedRecords, record];

            if (onChange) {
                onChange(newSelectedRecords);
            }
        }
    }, [disabled, selectedRecords, persistImmediately, persistRelation, onChange, toast, value, currentTableId, queryClient]);

    const handleRemoveRecord = useCallback(async (recordId: string) => {
        if (persistImmediately) {
            // Optimistically update the UI immediately
            // Preserve the original value format (IDs or objects)
            const currentValue = Array.isArray(value) ? value : [];
            const optimisticValue = currentValue.filter((v: any) => {
                const vId = typeof v === 'object' && v?.id ? v.id.toString() : v?.toString();
                return vId !== recordId.toString();
            });

            // Update via onChange to trigger UI update immediately
            if (onChange) {
                onChange(optimisticValue);
            }

            const success = await persistRelation(recordId, 'unlink');
            if (success) {
                toast.success('Record unlinked successfully');
                // Force refetch to ensure data is in sync with server
                if (currentTableId) {
                    queryClient.refetchQueries({
                        queryKey: ['tables', String(currentTableId)],
                        type: 'active'
                    });
                }
            } else {
                // Revert optimistic update on failure
                if (onChange) {
                    onChange(value);
                }
            }
        } else {
            // Update local state only (for form view)
            const newSelectedRecords = selectedRecords.filter(r => r.id !== recordId);
            if (onChange) {
                onChange(newSelectedRecords);
            }
        }
    }, [persistImmediately, persistRelation, selectedRecords, onChange, toast, value, currentTableId, queryClient]);

    const getRecordDisplayText = (record: RelatedRecord) => {
        // Try multiple fields in order of preference
        const titleFields = ['title', 'name', 'first_name', 'last_name', 'description'];

        for (const field of titleFields) {
            const value = record[field];
            if (value?.toString().trim()) {
                return value.toString().trim();
            }
        }

        // If it's a placeholder, show loading
        if (record._isPlaceholder) {
            return record.title || 'Loading...';
        }

        // Last resort
        return `Record ${record.id}`;
    };

    // Keyboard navigation - use paginatedRecords since that's what's actually rendered
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setDropdownPosition(null);
                setFocusedRecordIndex(-1);
            } else if (e.key === 'Enter' && focusedRecordIndex >= 0 && paginatedRecords[focusedRecordIndex]) {
                e.preventDefault();
                handleSelectRecord(paginatedRecords[focusedRecordIndex]);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedRecordIndex(prev => {
                    // If we're at the end of visible records and there are more, load them
                    if (prev >= paginatedRecords.length - 1 && hasMore && !isLoadingMore) {
                        setIsLoadingMore(true);
                        loadNextPage();
                        setTimeout(() => setIsLoadingMore(false), 100);
                        return prev; // Keep current index
                    }
                    return prev < paginatedRecords.length - 1 ? prev + 1 : prev;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedRecordIndex(prev => prev > 0 ? prev - 1 : -1);
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedRecordIndex, paginatedRecords, handleSelectRecord, hasMore, isLoadingMore, loadNextPage]);

    // Scroll focused record into view - only works with paginated records
    useEffect(() => {
        if (focusedRecordIndex >= 0 && focusedRecordIndex < paginatedRecords.length && recordsListRef.current) {
            const recordElement = recordsListRef.current.children[focusedRecordIndex] as HTMLElement;
            if (recordElement) {
                recordElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [focusedRecordIndex, paginatedRecords.length]);

    const getRelationTypeDisplay = () => {
        switch (relationType) {
            case 'one-to-one': return 'One to One';
            case 'has-many': return 'Has Many';
            case 'many-to-many': return 'Many to Many';
            default: return 'One to One';
        }
    };

    return (
        <div className="relative w-full min-w-0">
            {/* Trigger Button */}
            <div
                ref={triggerRef}
                role="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                tabIndex={disabled ? -1 : 0}
                aria-label={`${field.title} - ${selectedRecords.length} record${selectedRecords.length === 1 ? '' : 's'} linked`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className={`field-component ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isBorder ? 'field-component-border' : ''}`}
            >
                <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="flex items-center gap-1 flex-1 min-w-0 w-full overflow-hidden">
                        {isTableLoading ? (
                            <span className="text-sm text-gray-400 truncate block min-w-0">Loading...</span>
                        ) : selectedRecords.length === 0 ? (
                            <span className="text-sm text-gray-500 truncate block min-w-0">{placeholder}</span>
                        ) : (
                            <div className="flex items-center gap-1 flex-1 min-w-0 w-full overflow-hidden">
                                {/* Show first record with proper truncation */}
                                {selectedRecords.length === 1 ? (
                                    <div className="flex items-center gap-1 px-2 py-1 text-primary bg-blue-100 text-xs rounded-full border flex-shrink min-w-fit overflow-hidden" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
                                        <span
                                            className="truncate block min-w-0 flex-1 text-blue-500"
                                            title={getRecordDisplayText(selectedRecords[0])}
                                        >
                                            {getRecordDisplayText(selectedRecords[0])}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveRecord(selectedRecords[0].id);
                                            }}
                                            className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Show first record */}
                                        <div className="flex items-center gap-1 px-2 py-1 text-primary bg-blue-100 text-xs rounded-full border flex-shrink-0 min-w-fit max-w-fit overflow-hidden">
                                            <span
                                                className="truncate block min-w-0 flex-1 text-blue-500"
                                                title={getRecordDisplayText(selectedRecords[0])}
                                            >
                                                {getRecordDisplayText(selectedRecords[0])}
                                            </span>
                                            <button
                                                type='button'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveRecord(selectedRecords[0].id);
                                                }}
                                                className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {/* Show second record */}
                                        <div className="flex items-center gap-1 px-2 py-1 text-primary bg-blue-100 text-xs rounded-full border flex-shrink-0 min-w-0 max-w-[40%] overflow-hidden">
                                            <span
                                                className="truncate block min-w-0 flex-1 text-blue-500"
                                                title={getRecordDisplayText(selectedRecords[1])}
                                            >
                                                {getRecordDisplayText(selectedRecords[1])}
                                            </span>
                                            <button
                                                type='button'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveRecord(selectedRecords[1].id);
                                                }}
                                                className="hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {/* Show count for remaining records if more than 2 */}
                                        {selectedRecords.length > 2 && (
                                            <div
                                                className="flex items-center px-2 py-1 bg-blue-500 text-[var(--color-text-primary)] text-xs rounded-full border border-[var(--color-border-brand)] flex-shrink-0 cursor-pointer hover:opacity-80"
                                                title={selectedRecords.slice(2).map(r => getRecordDisplayText(r)).join(', ')}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Open dropdown to show remaining items
                                                    if (!isOpen) {
                                                        setIsOpen(true);
                                                    }
                                                }}
                                            >
                                                <span className="font-medium whitespace-nowrap">
                                                    +{selectedRecords.length - 2}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
            </div>

            {/* Dropdown Portal */}
            {isOpen && dropdownPosition && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-50 bg-card border rounded-xl shadow-xl max-h-96 w-96 overflow-hidden flex flex-col"
                    style={{
                        ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
                        ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <Link className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">{getRelationTypeDisplay()}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsOpen(false)}
                                aria-label="Close dropdown"
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-blue-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search records to link..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setFocusedRecordIndex(-1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setFocusedRecordIndex(0);
                                    }
                                }}
                                aria-label="Search records"
                                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent bg-background"
                            />
                            {searchTerm && (
                                <button
                                    type='button'
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end items-center space-x-2 mt-3">
                            <div className="text-xs text-gray-500">
                                {formatCompactNumber(selectedRecords.length)} of {formatCompactNumber(totalItems)} selected{hasMore && ` (${formatCompactNumber(paginatedRecords.length)} loaded)`}
                            </div>
                        </div>
                    </div>

                    {/* Records List */}
                    <div
                        ref={(node) => {
                            recordsListRef.current = node;
                            scrollContainerRef.current = node;
                        }}
                        role="listbox"
                        aria-label="Available records"
                        className="flex-1 overflow-y-auto min-h-0"
                    >
                        {isTableLoading ? (
                            <div className="p-4 text-center text-gray-500" role="status" aria-live="polite">
                                Loading records...
                            </div>
                        ) : totalItems === 0 ? (
                            <div className="p-4 text-center text-gray-500" role="status" aria-live="polite">
                                {debouncedSearchTerm ? 'No records found' : 'No records available'}
                            </div>
                        ) : (
                            paginatedRecords.map((record, index) => {
                                const isSelected = selectedRecords.some(r => r.id === record.id);
                                const isFocused = index === focusedRecordIndex;
                                const isRecordLoading = loadingRecordId === record.id;

                                return (
                                    <div
                                        key={record.id}
                                        role="option"
                                        aria-selected={isSelected}
                                        tabIndex={-1}
                                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer bg-card transition-colors ${isSelected ? 'bg-blue-500' : ''
                                            } ${isFocused ? 'bg-[var(--color-bg-brand-secondary)] text-black' : ''
                                            }`}
                                        onClick={() => {
                                            setFocusedRecordIndex(index);
                                            handleSelectRecord(record);
                                        }}
                                        onMouseEnter={() => setFocusedRecordIndex(index)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Mini-form display with better layout */}
                                                <div className="space-y-2">
                                                    {/* Main title */}
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {record.title || `Record ${record.id}`}
                                                        </h4>
                                                    </div>

                                                    {/* Status indicator */}
                                                    {isSelected && (
                                                        <div className="flex items-center space-x-1 mt-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span className="text-xs text-blue-500 font-medium">Linked</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                                                {isRecordLoading ? (
                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex items-center justify-center" aria-label="Loading" />
                                                ) : (
                                                    <button
                                                        type='button'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isSelected) {
                                                                handleRemoveRecord(record.id);
                                                            } else {
                                                                handleSelectRecord(record);
                                                            }
                                                        }}
                                                        aria-label={isSelected ? `Unlink ${getRecordDisplayText(record)}` : `Link ${getRecordDisplayText(record)}`}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-red-500 hover:bg-red-600 shadow-sm'
                                                            : 'bg-blue-500 hover:bg-blue-600 shadow-sm'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <X className="w-4 h-4 text-white" />
                                                        ) : (
                                                            <Plus className="w-4 h-4 text-white" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Loading more indicator */}
                        {isLoadingMore && (
                            <div className="p-4 text-center text-gray-500" role="status" aria-live="polite">
                                <div className="flex items-center justify-center space-x-2">
                                    <Loader size={4} />
                                    <span className="text-sm">Loading more records...</span>
                                </div>
                            </div>
                        )}

                        {/* Load More button */}
                        {hasMore && !isLoadingMore && (
                            <div className="p-3 text-center border-t">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    className="px-4 py-2 text-sm font-medium rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                >
                                    Load more ({formatCompactNumber(totalItems - paginatedRecords.length)} remaining)
                                </button>
                            </div>
                        )}
                    </div>

                </div>,
                document.body
            )}
        </div>
    );
};