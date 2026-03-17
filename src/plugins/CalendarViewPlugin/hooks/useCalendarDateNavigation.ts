// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback } from 'react';

type CalendarViewType = 'month' | 'week' | 'day' | 'year';

interface UseCalendarDateNavigationOptions {
  initialDate?: Date;
  initialView?: CalendarViewType;
}

export function useCalendarDateNavigation({
  initialDate = new Date(),
  initialView = 'month',
}: UseCalendarDateNavigationOptions = {}) {
  // Date navigation state
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<CalendarViewType>(initialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigate to previous period
  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'month') {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(prev.getDate() - 7);
      } else if (currentView === 'day') {
        newDate.setDate(prev.getDate() - 1);
      } else if (currentView === 'year') {
        newDate.setFullYear(prev.getFullYear() - 1);
      }
      return newDate;
    });
  }, [currentView]);

  // Navigate to next period
  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'month') {
        newDate.setMonth(prev.getMonth() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(prev.getDate() + 7);
      } else if (currentView === 'day') {
        newDate.setDate(prev.getDate() + 1);
      } else if (currentView === 'year') {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  }, [currentView]);

  // Navigate to today
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }, []);

  // Change view type
  const changeView = useCallback((view: CalendarViewType) => {
    setCurrentView(view);
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return {
    // State
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    
    // Handlers
    goToPrevious,
    goToNext,
    goToToday,
    changeView,
    toggleSidebar,
  };
}

