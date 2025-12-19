import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, Plus, Search, X, ChevronDown } from 'lucide-react';
// FRONTEND PAGINATION: Using linked records resolver to ensure all linked records are resolved
import { useTable, useInsertRelationData } from '../../../hooks/useApi';
import { useLinkedRecordsForField } from '../../../hooks/useLinkedRecordsResolver';
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
    // Current row context - these should be passed from the table row
    currentRowId?: number;
    currentTableId?: string;
    // New prop to control persistence behavior
    persistImmediately?: boolean; // Default: true (maintains backward compatibility)
    // Border styling prop
    isBorder?: boolean; // Default: false (maintains backward compatibility)
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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; position: 'above' | 'below' } | null>(null);
    const [focusedRecordIndex, setFocusedRecordIndex] = useState<number>(-1);

    // PAGINATION DISABLED - Pagination state commented out
    // Pagination state
    // const [allRecords, setAllRecords] = useState<RelatedRecord[]>([]);
    // const [currentPage, setCurrentPage] = useState(1);
    // const [hasMore, setHasMore] = useState(true);
    // const [isLoadingMore, setIsLoadingMore] = useState(false);

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

    // PAGINATION DISABLED - Fetch target table data without pagination
    // Fetch target table data with pagination (initial 30 records)
    // const { data: tableData, isLoading: isTableLoading } = useTable(targetTableId || '', { pageNumber: 1, pageLimit: 30 });
    const { data: tableData, isLoading: isTableLoading } = useTable(targetTableId || ''); // No pagination - fetches all records
    const insertRelationMutation = useInsertRelationData();
    // PAGINATION DISABLED - useGetRecordsByPagination commented out
    // const { mutateAsync: fetchPaginatedRecords } = useGetRecordsByPagination(targetTableId || '');

    // PAGINATION DISABLED - Initialize records directly from tableData (no pagination logic)
    // Initialize records from initial table data and reset when target table changes
    // useEffect(() => {
    //     if (tableData?.data?.records) {
    //         const initialRecords = tableData.data.records.map((record: any) => ({
    //             id: record.id.toString(),
    //             ...record
    //         }));
    //         setAllRecords(initialRecords);
    //         // Check if there are more records (if we got exactly 30, there might be more)
    //         // Also check if total count is available in response
    //         const totalRecords = tableData?.data?.meta?.total || tableData?.data?.total || null;
    //         if (totalRecords !== null) {
    //             setHasMore(initialRecords.length < totalRecords);
    //         } else {
    //             // Fallback: assume more if we got exactly 30
    //             setHasMore(initialRecords.length === 30);
    //         }
    //         setCurrentPage(1);
    //     } else if (!isTableLoading) {
    //         // Reset if no data and not loading
    //         setAllRecords([]);
    //         setHasMore(false);
    //         setCurrentPage(1);
    //     }
    // }, [tableData, isTableLoading, targetTableId]);

    // PAGINATION DISABLED - loadMoreRecords function commented out
    // Function to load more records
    // const loadMoreRecords = useCallback(async () => {
    //     if (isLoadingMore || !hasMore || !targetTableId) return;

    //     setIsLoadingMore(true);
    //     try {
    //         const result = await fetchPaginatedRecords({
    //             pageNumber: currentPage + 1,
    //             pageSize: 30
    //         });
    //         const newRecords = (result?.data?.records || []).map((record: any) => ({
    //             id: record.id.toString(),
    //             ...record
    //         }));

    //         if (newRecords.length < 30) {
    //             setHasMore(false);
    //         }

    //         if (newRecords.length > 0) {
    //             setAllRecords(prev => {
    //                 // Avoid duplicates by checking IDs
    //                 const existingIds = new Set(prev.map(r => r.id));
    //                 const uniqueNewRecords = newRecords.filter(r => !existingIds.has(r.id));
    //                 return [...prev, ...uniqueNewRecords];
    //             });
    //             setCurrentPage(prev => prev + 1);
    //         } else {
    //             setHasMore(false);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching more records:', error);
    //         setHasMore(false);
    //     } finally {
    //         setIsLoadingMore(false);
    //     }
    // }, [isLoadingMore, hasMore, targetTableId, fetchPaginatedRecords, currentPage]);


    // FRONTEND PAGINATION: Get all records from target table (no pagination)
    // Since pagination is disabled, useTable returns all records
    const records = useMemo(() => {
        if (!tableData?.data?.records) return [];
        return tableData.data.records.map((record: any) => ({
            id: record.id.toString(),
            ...record
        }));
    }, [tableData?.data?.records]);

    // FRONTEND PAGINATION: Use linked records resolver as a safety net
    // This ensures linked records are resolved even if they're not in the initial records array
    // Note: This requires passing allRecords from parent table, but for now we rely on useTable returning all records
    // const linkedRecordsMap = useLinkedRecordsForField(
    //     allTableRecords || [], // Would need to be passed from parent
    //     field.id || field.key || '',
    //     targetTableId || ''
    // );

    // Compute selected records from value prop - ROBUST VERSION
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
                return fieldValue && fieldValue.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
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
                target_row_id: parseInt(recordId),
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

    // const handleSelectAll = useCallback(async () => {
    //     if (disabled) return;

    //     const unselectedRecords = filteredRecords.filter(record =>
    //         !selectedRecords.some(selected => selected.id === record.id)
    //     );

    //     if (unselectedRecords.length === 0) return;

    //     if (persistImmediately) {
    //         if (!currentRowId || !currentTableId) return;

    //         try {
    //             setIsLoading(true);
    //             const promises = unselectedRecords.map(record =>
    //                 persistRelation(record.id, 'link')
    //             );
    //             const results = await Promise.all(promises);
    //             const successCount = results.filter(Boolean).length;

    //             if (successCount > 0) {
    //                 toast.success(`Linked ${successCount} record${successCount > 1 ? 's' : ''} successfully`);
    //             }
    //         } catch (error: any) {
    //             const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to link records';
    //             toast.error(errorMessage);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     } else {
    //         // Update local state only (for form view)
    //         const newSelectedRecords = [...selectedRecords, ...unselectedRecords];
    //         if (onChange) {
    //             onChange(newSelectedRecords);
    //         }
    //     }
    // }, [disabled, filteredRecords, selectedRecords, persistImmediately, currentRowId, currentTableId, persistRelation, onChange, toast]);

    // const handleClearAll = useCallback(async () => {
    //     if (disabled || selectedRecords.length === 0) return;

    //     if (persistImmediately) {
    //         if (!currentRowId || !currentTableId) return;

    //         try {
    //             setIsLoading(true);
    //             const promises = selectedRecords.map(record =>
    //                 persistRelation(record.id, 'unlink')
    //             );
    //             const results = await Promise.all(promises);
    //             const successCount = results.filter(Boolean).length;

    //             if (successCount > 0) {
    //                 toast.success(`Unlinked ${successCount} record${successCount > 1 ? 's' : ''} successfully`);
    //             }
    //         } catch (error: any) {
    //             const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to unlink records';
    //             toast.error(errorMessage);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     } else {
    //         // Update local state only (for form view)
    //         if (onChange) {
    //             onChange([]);
    //         }
    //     }
    // }, [disabled, selectedRecords, persistImmediately, currentRowId, currentTableId, persistRelation, onChange, toast]);

    const getRecordDisplayText = (record: RelatedRecord) => {
        // Try multiple fields in order of preference
        const titleFields = ['title', 'name', 'first_name', 'last_name', 'description'];

        for (const field of titleFields) {
            const value = record[field];
            if (value && value.toString().trim()) {
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

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
                aria-label={`${field.title} - ${selectedRecords.length} record${selectedRecords.length !== 1 ? 's' : ''} linked`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className={`field-component ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isBorder ? 'field-component-border' : ''}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                        {isTableLoading ? (
                            <span className="text-sm text-gray-400 truncate block min-w-0">Loading...</span>
                        ) : selectedRecords.length === 0 ? (
                            <span className="text-sm text-gray-500 truncate block min-w-0">{placeholder}</span>
                        ) : (
                            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                                {/* Show first record with proper truncation */}
                                {selectedRecords.length === 1 ? (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-brand-primary)] text-[black text-xs rounded-full border flex-shrink min-w-fit overflow-hidden" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
                                        <span
                                            className="truncate block min-w-0 flex-1"
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
                                        <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-brand-primary)] text-black text-xs rounded-full border flex-shrink-0 min-w-fit max-w-fit overflow-hidden">
                                            <span
                                                className="truncate block min-w-0 flex-1"
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
                                        <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-brand-primary)] text-black text-xs rounded-full border flex-shrink-0 min-w-0 max-w-[35%] overflow-hidden">
                                            <span
                                                className="truncate block min-w-0 flex-1"
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
                                                className="flex items-center px-2 py-1 bg-[var(--color-bg-brand-primary)] text-black text-xs rounded-full border border-[var(--color-border-brand)] flex-shrink-0 cursor-pointer hover:opacity-80"
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
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
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
                        {/* Bulk Operations - Show for has-many and many-to-many */}
                        {/* {(relationType === 'has-many' || relationType === 'many-to-many') && (
                            <div className="flex items-center space-x-2 mt-3">
                                <button
                                    type='button'
                                    onClick={handleSelectAll}
                                    disabled={disabled || isLoading || filteredRecords.every(record =>
                                        selectedRecords.some(selected => selected.id === record.id)
                                    )}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Select All</span>
                                </button>
                                <button
                                    type='button'
                                    onClick={handleClearAll}
                                    disabled={disabled || isLoading || selectedRecords.length === 0}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    <span>Clear All</span>
                                </button>
                                <div className="text-xs text-gray-500">
                                    {selectedRecords.length} of {filteredRecords.length} selected
                                </div>
                            </div>
                        )} */}
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
                                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer bg-card transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-green-500' : ''
                                            } ${isFocused ? 'bg-[var(--color-bg-brand-secondary)] text-black' : ''
                                            }`}
                                        onClick={() => {
                                            setFocusedRecordIndex(index);
                                            handleSelectRecord(record);
                                        }}
                                        onMouseEnter={() => setFocusedRecordIndex(index)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Mini-form display with better layout */}
                                                <div className="space-y-2">
                                                    {/* Main title */}
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {record.title || `Record ${record.id}`}
                                                        </h4>
                                                        {isSelected && (
                                                            <div className="flex-shrink-0 w-2 h-2 bg-[var(--color-bg-brand-primary)] text-[var(--color-text-primary)] rounded-full"></div>
                                                        )}
                                                    </div>

                                                    {/* Status indicator */}
                                                    {isSelected && (
                                                        <div className="flex items-center space-x-1 mt-2">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="text-xs text-green-700 font-medium">Linked</span>
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
                                                            : 'bg-green-500 hover:bg-green-600 shadow-sm'
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