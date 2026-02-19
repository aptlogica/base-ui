import { CalendarEvent } from '../hooks/useCalendarData';

export const DATETIME_TYPES = new Set([
  'datetime',
  'createdtime',
  'lastmodifiedtime'
]);

export const isDateTimeFieldType = (dateField?: any): boolean => {
  if (!dateField) return false;
  const type = dateField.type?.toLowerCase();
  const uidt = dateField.uidt?.toLowerCase();
  return (Boolean(type) && DATETIME_TYPES.has(type)) || (Boolean(uidt) && DATETIME_TYPES.has(uidt));
};

export const getHourLabel = (hour: number): string => {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
};

export const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getEventsForDateKey = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const dateStr = toLocalDateKey(date);
  return events.filter(event => {
    const eventDateTime = event.dateTime instanceof Date ? event.dateTime : new Date(event.dateTime as any);
    if (!Number.isNaN(eventDateTime.getTime())) {
      return toLocalDateKey(eventDateTime) === dateStr;
    }
    return event.date === dateStr;
  });
};

export const getEventsForTimeSlot = (events: CalendarEvent[], date: Date, hour: number): CalendarEvent[] => {
  const dateStr = toLocalDateKey(date);
  return events.filter(event => {
    const eventDateTime = event.dateTime instanceof Date ? event.dateTime : new Date(event.dateTime as any);
    if (!Number.isNaN(eventDateTime.getTime())) {
      if (toLocalDateKey(eventDateTime) !== dateStr) return false;
      return eventDateTime.getHours() === hour;
    }
    if (event.date !== dateStr) return false;
    const eventHour = new Date(event.dateTime).getHours();
    return eventHour === hour;
  });
};
