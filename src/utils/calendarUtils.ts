import { pad2 } from './timeFormatUtils';

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const getStartDayMonday = (firstDay: Date): number => {
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  return (Number.isNaN(startDay) || startDay < 0) ? 0 : startDay;
};

export const buildCalendarWeeks = (
  year: number,
  month: number,
  weekStartsOnMonday: boolean = true
): (string | null)[][] => {
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDay = new Date(year, month, 1);
  const startDay = weekStartsOnMonday ? getStartDayMonday(firstDay) : firstDay.getDay();

  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = new Array(startDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dayISO = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    week.push(dayISO);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
};
