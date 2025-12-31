import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Download, Search, PanelRightClose, Plus, Settings, Palette, List, Filter, MoreVertical, SortAsc, SortDesc } from "lucide-react";
import { FilterPopover } from '../../../components/shared/table/FilterPopover';
import { FieldsPopover } from '../../../components/shared/table/FieldsPopover';
import { GridColumn } from '../../GridViewPlugin/types/grid.types';
import { SortItem } from '../../../utils/sortUtils';
import { CalendarFieldConfiguration } from './CalendarFieldSelector';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  dateField?: any;
  dateFields: any[];
  onDateFieldChange: (fieldId: string) => void;
  onExport: () => void;
  onCreateRecord?: () => void; // Optional - only provided if user has permission
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  // Props for the popover components
  columns: GridColumn[];
  fieldConfig: any[];
  filters: { column: string; operator: string; value: string }[];
  onFieldToggle: (fieldId: string) => void;
  onAddFilter: (filter: { column: string; operator: string; value: string }) => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter?: (index: number, updates: Partial<{ column: string; operator: string; value: string }>) => void;
  onRealTimeFilter?: (filter: { column: string; operator: string; value: string } | null) => void;
  onGroupByChange: (column: GridColumn | undefined) => void;
  tableId: string;
  events?: Array<{ date: string; id: string; title: string;[key: string]: any }>;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onDateChange,
  currentView,
  onViewChange,
  dateField,
  dateFields,
  onDateFieldChange,
  onExport,
  onCreateRecord,
  sidebarCollapsed,
  onToggleSidebar,
  columns,
  fieldConfig,
  filters,
  onFieldToggle,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onRealTimeFilter,
  onGroupByChange,
  tableId,
  events = [],
}) => {
  // Handler to update a filter at a specific index
  // Use the provided onUpdateFilter if available, otherwise fall back to remove+add workaround
  const handleUpdateFilter = useCallback((index: number, updates: Partial<{ column: string; operator: string; value: string }>) => {
    if (onUpdateFilter) {
      onUpdateFilter(index, updates);
    } else {
      // Fallback: remove and re-add (legacy behavior)
      if (index < 0 || index >= filters.length) return;
      const updatedFilter = { ...filters[index], ...updates };
      onRemoveFilter(index);
      onAddFilter(updatedFilter);
    }
  }, [filters, onAddFilter, onRemoveFilter, onUpdateFilter]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const viewTabsRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);
  const [useDropdown, setUseDropdown] = useState(false);

  // Handle click outside to close date picker and view dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setShowViewDropdown(false);
      }
    };

    if (showDatePicker || showViewDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDatePicker, showViewDropdown]);

  // Check if we should use dropdown based on container width
  useEffect(() => {
    const checkWidth = () => {
      if (headerContainerRef.current) {
        const containerWidth = headerContainerRef.current.clientWidth;
        // Use dropdown if container width is less than 1200px or window is less than 1024px
        // This gives us more space for tabs on larger screens but switches to dropdown when space is tight
        const shouldUseDropdown = containerWidth < 1200 || window.innerWidth < 1024;
        setUseDropdown(shouldUseDropdown);
      } else {
        // Fallback: check window width
        setUseDropdown(window.innerWidth < 1024);
      }
    };

    // Check on mount and resize
    checkWidth();
    window.addEventListener('resize', checkWidth);
    // Also use ResizeObserver for more accurate detection when container resizes
    const resizeObserver = new ResizeObserver(checkWidth);
    if (headerContainerRef.current) {
      resizeObserver.observe(headerContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkWidth);
      resizeObserver.disconnect();
    };
  }, []);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Get week range for current date
  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return { start: startOfWeek, end: endOfWeek };
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  // Format date for day view (e.g., "4 Oct 25")
  const formatDayDate = (date: Date) => {
    const day = date.getDate();
    const month = months[date.getMonth()].slice(0, 3); // Short month name
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  // Get current display text based on view
  const getCurrentDisplayText = () => {
    if (currentView === 'week') {
      const { start, end } = getWeekRange(currentDate);
      return `${formatDate(start)} - ${formatDate(end)}`;
    } else if (currentView === 'day') {
      return formatDayDate(currentDate);
    } else if (currentView === 'year') {
      return currentDate.getFullYear().toString();
    } else {
      // Month view
      const month = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const navigateYearByDecade = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 10 : -10));
    onDateChange(newDate);
  };

  const selectWeek = (weekStartDate: Date) => {
    onDateChange(weekStartDate);
    setShowDatePicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    onDateChange(newDate);
    setShowDatePicker(false);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const views = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  // Generate weeks for the current month
  const getWeeksForMonth = (date: Date): { start: Date; end: Date }[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: { start: Date; end: Date }[] = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday

    while (startDate <= lastDay) {
      const weekEnd = new Date(startDate);
      weekEnd.setDate(startDate.getDate() + 6);
      weeks.push({ start: new Date(startDate), end: new Date(weekEnd) });
      startDate.setDate(startDate.getDate() + 7);
    }

    return weeks;
  };

  // Helper function to check if a date has events
  const hasEventsForDate = (date: Date): boolean => {
    if (!events || events.length === 0) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return events.some(event => event.date === dateStr || event.date?.startsWith(dateStr));
  };

  const renderDatePicker = () => {
    if (currentView === 'week') {
      // Week picker
      const weeks = getWeeksForMonth(currentDate);
      return (
        <div
          className="absolute top-full left-0 mt-1 w-80 bg-card border rounded-xl shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weeks List */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {weeks.map((week, index) => {
              const isCurrentWeek = week.start <= currentDate && week.end >= currentDate;
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectWeek(week.start);
                  }}
                  className={`w-full p-2 text-left text-sm rounded-xl mb-1 transition-colors ${isCurrentWeek
                    ? 'bg-[var(--color-bg-brand-primary)] text-black font-semibold'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                    }`}
                >
                  {formatDate(week.start)} - {formatDate(week.end)}
                </button>
              );
            })}
          </div>
        </div>
      );
    } else if (currentView === 'day') {
      // Day picker - mini calendar
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days: Date[] = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(new Date(date));
      }

      return (
        <div
          className="absolute top-full left-0 mt-1 w-80 bg-card border rounded-xl shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              {months[month]} {year}
            </h3>

            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Grid */}
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === currentDate.toDateString();
                const hasEvents = hasEventsForDate(date);

                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateChange(date);
                      setShowDatePicker(false);
                    }}
                    className={`relative w-8 h-8 text-sm rounded-full transition-colors flex flex-col items-center justify-center ${isSelected
                      ? 'bg-[var(--color-bg-brand-primary)] text-black'
                      : isToday
                        ? 'text-[var(--color-text-primary)] border border-[var(--color-bg-brand-primary)]'
                        : isCurrentMonth
                          ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {/* Event indicator - show dot if date has events */}
                    {hasEvents && (
                      <div className="absolute -top-2 flex justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-bg-brand-primary)]" />
                      </div>
                    )}
                    <span className="text-xs">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else if (currentView === 'year') {
      // Year picker
      const currentYear = currentDate.getFullYear();
      const startYear = Math.floor(currentYear / 10) * 10; // Start of decade
      const years = Array.from({ length: 12 }, (_, i) => startYear + i);

      return (
        <div
          className="absolute top-full left-0 mt-1 w-64 bg-card border rounded-xl shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Decade Navigation */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              onClick={() => navigateYearByDecade('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              {startYear} - {startYear + 11}
            </h3>

            <button
              onClick={() => navigateYearByDecade('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year Grid */}
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newDate = new Date(currentDate);
                    newDate.setFullYear(year);
                    onDateChange(newDate);
                    setShowDatePicker(false);
                  }}
                  className={`p-2 text-sm font-medium rounded-xl transition-colors ${year === currentYear
                    ? 'bg-[var(--color-bg-brand-primary)] text-black'
                    : 'text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      // Month picker for month and day views
      return (
        <div
          className="absolute top-full left-0 mt-1 w-64 bg-card border border-gray-200 rounded-xl shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Year Navigation */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              onClick={() => navigateYear('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.getFullYear()}
            </h3>

            <button
              onClick={() => navigateYear('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Grid */}
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectMonth(index);
                  }}
                  className={`p-2 text-sm font-medium rounded-xl transition-colors ${index === currentDate.getMonth()
                    ? 'bg-[var(--color-bg-brand-primary)] text-black'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-card border-b border-gray-200" ref={headerContainerRef}>
      <div className="px-4 py-2">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-between">
          {/* Left Section - Date Navigation */}
          <div className="flex items-center space-x-4">
            {/* Date/Week Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-900 bg-card border rounded-xl hover:bg-gray-50 focus:outline-none"
              >
                <span>{getCurrentDisplayText()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div
                  ref={datePickerRef}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {renderDatePicker()}
                </div>
              )}
            </div>

            {/* Today Button */}
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border rounded-xl hover:bg-gray-50 focus:outline-none"
            >
              Today
            </button>

            {/* Navigation Arrows */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  if (currentView === 'week') navigateWeek('prev');
                  else if (currentView === 'day') navigateMonth('prev');
                  else if (currentView === 'year') navigateYear('prev');
                  else navigateMonth('prev');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (currentView === 'week') navigateWeek('next');
                  else if (currentView === 'day') navigateMonth('next');
                  else if (currentView === 'year') navigateYear('next');
                  else navigateMonth('next');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* More Options */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
              {/* <MoreVertical className="w-4 h-4" /> */}
            </button>
          </div>

          {/* Center Section - View Tabs or Dropdown */}
          {useDropdown ? (
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-900 bg-card border rounded-xl hover:bg-gray-50 focus:outline-none"
              >
                <span>{views.find(v => v.key === currentView)?.label || 'Month'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showViewDropdown && (
                <div
                  className="absolute top-full left-0 mt-1 space-y-1 p-1.5 w-32 bg-card border rounded-xl shadow-lg z-50"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {views.map((view) => (
                    <button
                      key={view.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewChange(view.key);
                        setShowViewDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium rounded-xl transition-colors ${currentView === view.key
                        ? 'bg-[var(--color-bg-brand-primary)] text-black'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{view.label}</span>
                        {currentView === view.key && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1" ref={viewTabsRef}>
              {views.map((view) => (
                <button
                  key={view.key}
                  onClick={() => onViewChange(view.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${currentView === view.key
                    ? 'bg-card var(--color-bg-brand-primary) shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          )}

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Date Field Selector */}
            <CalendarFieldConfiguration
              columns={columns}
              dateField={dateField}
              onDateFieldChange={(field) => onGroupByChange(field)}
            />

            {/* Fields Popover */}
            <FieldsPopover
              columns={columns}
              fieldConfig={fieldConfig}
              onFieldToggle={onFieldToggle}
              tableId={tableId}
              label="Fields"
              iconComponent={List}
            />

            {/* Filter Popover */}
            <FilterPopover
              columns={columns}
              filters={filters}
              onAddFilter={onAddFilter}
              onRemoveFilter={onRemoveFilter}
              onUpdateFilter={handleUpdateFilter}
              onRealTimeFilter={onRealTimeFilter}
            />

            {/* Export */}
            <button
              onClick={onExport}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Toggle Sidebar */}
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <PanelRightClose className="w-5 h-5" />
            </button>

            {/* Create Record */}
            {/* <button 
          onClick={onCreateRecord}
          className="px-6 py-2 rounded-xl btn-primary text-[var(--color-text-primary)] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-3 h-3" />
          <span>Add Record</span>
        </button> */}
          </div>
        </div>

        {/* Mobile Layout - Shown on mobile */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Top row: Date navigation and create button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Date/Week Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-900 bg-card border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                >
                  <span>{getCurrentDisplayText()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div
                    ref={datePickerRef}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {renderDatePicker()}
                  </div>
                )}
              </div>

              {/* Today Button */}
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Today
              </button>
            </div>

            {/* Create Record */}
            <button
              onClick={onCreateRecord}
              className="px-4 py-2 rounded-xl btn-primary text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              <span>Create</span>
            </button>
          </div>

          {/* Second row: View tabs and navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
              {views.map((view) => (
                <button
                  key={view.key}
                  onClick={() => onViewChange(view.key)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === view.key
                    ? 'bg-card text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1">
              {/* Navigation Arrows */}
              <button
                onClick={() => {
                  if (currentView === 'week') navigateWeek('prev');
                  else if (currentView === 'day') navigateMonth('prev');
                  else if (currentView === 'year') navigateYear('prev');
                  else navigateMonth('prev');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (currentView === 'week') navigateWeek('next');
                  else if (currentView === 'day') navigateMonth('next');
                  else if (currentView === 'year') navigateYear('next');
                  else navigateMonth('next');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Export */}
              <button
                onClick={onExport}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Toggle Sidebar */}
              <button
                onClick={onToggleSidebar}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;