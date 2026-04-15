import { SLOT_MINUTES } from '../constants/app.js';

export const toTs = (value) => new Date(value).getTime();
export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
export const isValidDateRange = (start, end) => start && end && toTs(start) < toTs(end);

export const formatRangeDate = (date) =>
  date.toLocaleDateString('fr-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatCalendarDayHeader = (date, dayCount) =>
  date.toLocaleDateString(
    'fr-CH',
    dayCount > 1
      ? { weekday: 'short', day: '2-digit', month: '2-digit' }
      : { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }
  );

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateInputValue = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const formatHourLabel = (slotIndex) => {
  const hour = Math.floor((slotIndex * SLOT_MINUTES) / 60);
  const minutes = (slotIndex * SLOT_MINUTES) % 60;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const addDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

export const addMinutes = (value, minutes) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

export const getWeekStartMonday = (value) => {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
};
