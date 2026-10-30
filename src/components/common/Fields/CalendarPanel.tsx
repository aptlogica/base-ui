// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
// Month calendar with month / year pickers, shared by the Date and DateTime fields
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayISO } from '../../../utils/timeFormatUtils';
import { buildCalendarWeeks, MONTH_LABELS } from '../../../utils/calendarUtils';

interface CalendarPanelProps {
  calendarMonth: Date;
  onCalendarMonthChange: React.Dispatch<React.SetStateAction<Date>>;
  selectedISO: string; // YYYY-MM-DD of the picked day
  onSelect: (isoDay: string) => void;
  readOnly?: boolean;
  hideTodayButton?: boolean;
  isDayDisabled?: (isoDay: string) => boolean;
}

const PICKER_CLASS = 'absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 rounded-xl border bg-background shadow-lg z-50';
const PICKER_TRIGGER_CLASS = 'px-3 py-1 text-sm font-medium hover:bg-gray-100 text-(--color-text-primary) rounded-md transition-colors flex items-center gap-1';
const PICKER_NAV_CLASS = 'h-8 w-8 grid place-items-center rounded-xl hover:bg-gray-100 transition-colors';
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const stopThen = (action: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  action();
};

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  calendarMonth,
  onCalendarMonthChange,
  selectedISO,
  onSelect,
  readOnly = false,
  hideTodayButton = false,
  isDayDisabled,
}) => {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear); // year page starts at the current year
  const years = useMemo(() => Array.from({ length: 12 }, (_, i) => startYear + i), [startYear]);

  // Close an open month / year picker on a click outside of it
  useEffect(() => {
    if (!showYearPicker && !showMonthPicker) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (showYearPicker && !document.querySelector('[data-year-picker]')?.contains(target)) {
        setShowYearPicker(false);
      }
      if (showMonthPicker && !document.querySelector('[data-month-picker]')?.contains(target)) {
        setShowMonthPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showYearPicker, showMonthPicker]);

  const safeMonth = Number.isNaN(calendarMonth.getTime()) ? new Date() : calendarMonth;
  const year = safeMonth.getFullYear();
  const month = safeMonth.getMonth();
  const todayISO = getTodayISO();
  const weeks = buildCalendarWeeks(year, month, true);

  const selectYear = (value: number) => {
    onCalendarMonthChange(new Date(value, month, 1));
    setShowYearPicker(false);
  };

  const selectMonth = (value: number) => {
    onCalendarMonthChange(new Date(year, value, 1));
    setShowMonthPicker(false);
  };

  const shiftMonthYear = (delta: number) =>
    onCalendarMonthChange((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1));

  const renderPickerHeader = (title: number, onPrev: (e: React.MouseEvent) => void, onNext: (e: React.MouseEvent) => void) => (
    <div className="flex items-center justify-between p-2 border-b">
      <button type="button" onClick={onPrev} className={PICKER_NAV_CLASS}>
        <ChevronLeft className="w-4 h-4 text-(--color-text-primary)" />
      </button>
      <div className="text-sm font-medium text-(--color-text-primary)">{title}</div>
      <button type="button" onClick={onNext} className={PICKER_NAV_CLASS}>
        <ChevronRight className="w-4 h-4 text-(--color-text-primary)" />
      </button>
    </div>
  );

  const renderOption = (key: string | number, label: string | number, active: boolean, rounded: string, onClick: () => void) => (
    <button
      type="button"
      key={key}
      className={[
        `w-full py-2 ${rounded} text-sm text-center transition-colors`,
        'text-(--color-text-primary) hover:bg-(--color-bg-brand-primary) hover:text-black',
        active ? 'bg-(--color-bg-brand-secondary) text-black font-semibold' : '',
      ].join(' ')}
      onClick={stopThen(onClick)}
    >
      {label}
    </button>
  );

  const renderPickerToggle = (label: string | number, open: boolean, onToggle: () => void) => (
    <button type="button" className={PICKER_TRIGGER_CLASS} onClick={stopThen(onToggle)}>
      {label}
      <ChevronLeft className={`w-3 h-3 text-(--color-text-primary) transition-transform ${open ? 'rotate-90' : '-rotate-90'}`} />
    </button>
  );

  return (
    <div className="p-2 bg-background rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => onCalendarMonthChange(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4 text-(--color-text-primary)" />
          </button>

          <div className="flex items-center gap-1">
            <div className="relative" data-month-picker>
              {renderPickerToggle(MONTH_LABELS[month], showMonthPicker, () => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              })}
              {showMonthPicker && (
                <div className={PICKER_CLASS}>
                  {renderPickerHeader(
                    year,
                    stopThen(() => shiftMonthYear(-1)),
                    stopThen(() => shiftMonthYear(1)),
                  )}
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {MONTH_LABELS.map((monthName, index) =>
                      renderOption(monthName, monthName, index === month, 'rounded-xl', () => selectMonth(index)),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" data-year-picker>
              {renderPickerToggle(year, showYearPicker, () => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              })}
              {showYearPicker && (
                <div className={PICKER_CLASS}>
                  {renderPickerHeader(
                    currentYear,
                    stopThen(() => setStartYear((y) => y - 12)),
                    stopThen(() => setStartYear((y) => y + 12)),
                  )}
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {years.map((yearOption) =>
                      renderOption(yearOption, yearOption, yearOption === year, 'rounded-md', () => selectYear(yearOption)),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => onCalendarMonthChange(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="w-4 h-4 text-(--color-text-primary)" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, idx) => {
          let dayClasses = 'text-(--color-text-primary) hover:bg-(--color-bg-brand-primary)';
          if (day === selectedISO) {
            dayClasses = 'bg-(--color-bg-brand-primary) text-black font-bold';
          } else if (day === todayISO) {
            dayClasses = 'text-(--color-bg-brand-primary)';
          }

          return (
            <button
              type="button"
              key={day || `empty-${idx}`}
              className={`w-8 h-8 rounded-xl text-center text-sm font-medium hover:bg-(--color-bg-brand-primary) hover:text-black transition-colors ${dayClasses} ${day ? '' : 'opacity-0 pointer-events-none'}`}
              onClick={() => day && !readOnly && onSelect(day)}
              disabled={!day || readOnly || !!isDayDisabled?.(day)}
            >
              {day ? Number(day.split('-')[2]) : ''}
            </button>
          );
        })}
      </div>

      {!hideTodayButton && (
        <div className="flex justify-center mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-(--color-bg-brand-primary) text-black hover:bg-(--color-bg-brand-secondary) text-sm font-medium transition-colors"
            onClick={() => !readOnly && onSelect(todayISO)}
            disabled={readOnly}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
};
