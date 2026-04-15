import { CALENDAR_ROW_HEIGHT, MINUTES_PER_DAY, SLOT_MINUTES } from '../constants/app.js';
import { addDays, isValidDateRange, overlaps, toTs } from './datetime.js';

export const buildCalendarSegments = (events, rangeStart, dayCount) => {
  const columns = Array.from({ length: dayCount }, () => []);
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = addDays(rangeStart, dayCount).getTime();

  for (const event of events) {
    const eventStartMs = toTs(event.start);
    const eventEndMs = toTs(event.end);
    if (!Number.isFinite(eventStartMs) || !Number.isFinite(eventEndMs) || eventEndMs <= eventStartMs) continue;
    if (!overlaps(eventStartMs, eventEndMs, rangeStartMs, rangeEndMs)) continue;

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      const dayStart = addDays(rangeStart, dayIndex);
      const dayEnd = addDays(dayStart, 1);
      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();
      if (!overlaps(eventStartMs, eventEndMs, dayStartMs, dayEndMs)) continue;

      const segmentStartMs = Math.max(eventStartMs, dayStartMs);
      const segmentEndMs = Math.min(eventEndMs, dayEndMs);
      const startMinutes = Math.max(0, Math.floor((segmentStartMs - dayStartMs) / 60000));
      const endMinutes = Math.min(MINUTES_PER_DAY, Math.ceil((segmentEndMs - dayStartMs) / 60000));
      const topPx = (startMinutes / SLOT_MINUTES) * CALENDAR_ROW_HEIGHT;
      const heightPx = Math.max(((endMinutes - startMinutes) / SLOT_MINUTES) * CALENDAR_ROW_HEIGHT, 16);

      columns[dayIndex].push({
        id: event.id,
        title: event.title,
        topPx,
        heightPx,
        backgroundColor: event.backgroundColor,
        textColor: event.textColor ?? '#ffffff',
        eventType: event.extendedProps?.eventType,
        absenceId: event.extendedProps?.absenceId,
        firefighterId: event.extendedProps?.firefighterId
      });
    }
  }

  columns.forEach((segments) => segments.sort((a, b) => a.topPx - b.topPx));
  return columns;
};

export const subtractFromInterval = (startMs, endMs, exclusions) => {
  let segments = [{ start: startMs, end: endMs }];
  for (const exclusion of exclusions) {
    const exclusionStart = toTs(exclusion.start);
    const exclusionEnd = toTs(exclusion.end);
    if (!Number.isFinite(exclusionStart) || !Number.isFinite(exclusionEnd)) continue;
    const nextSegments = [];
    for (const segment of segments) {
      if (!overlaps(segment.start, segment.end, exclusionStart, exclusionEnd)) {
        nextSegments.push(segment);
        continue;
      }
      if (exclusionStart > segment.start) {
        nextSegments.push({ start: segment.start, end: exclusionStart });
      }
      if (exclusionEnd < segment.end) {
        nextSegments.push({ start: exclusionEnd, end: segment.end });
      }
    }
    segments = nextSegments;
    if (segments.length === 0) break;
  }
  return segments.filter((segment) => segment.end > segment.start);
};

export const roleAssignmentPossible = (members, requirements) => {
  const slots = [];
  Object.entries(requirements).forEach(([role, count]) => {
    for (let i = 0; i < count; i += 1) slots.push(role);
  });

  const used = new Set();
  const canAssign = (slotIndex) => {
    if (slotIndex === slots.length) return true;
    const role = slots[slotIndex];
    for (const member of members) {
      if (used.has(member.id) || !member.fonctions.includes(role)) continue;
      used.add(member.id);
      if (canAssign(slotIndex + 1)) return true;
      used.delete(member.id);
    }
    return false;
  };
  return canAssign(0);
};

export const sortDutyWeeks = (weeks) => [...weeks].sort((a, b) => toTs(a.start) - toTs(b.start));

export const getShiftSlots = (startRaw, endRaw) => {
  if (!isValidDateRange(startRaw, endRaw)) return [];
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  const slots = [];

  const weekendStart = new Date(start);
  const weekendEnd = new Date(start);
  const day = weekendEnd.getDay();
  const deltaToMonday = (8 - day) % 7 || 7;
  weekendEnd.setDate(weekendEnd.getDate() + deltaToMonday);
  weekendEnd.setHours(6, 0, 0, 0);

  const weekendEndBounded = weekendEnd > end ? end : weekendEnd;
  if (weekendStart < weekendEndBounded) {
    slots.push({
      type: 'weekend',
      label: 'Weekend',
      start: weekendStart.toISOString(),
      end: weekendEndBounded.toISOString()
    });
  }

  const weekdayCursor = new Date(weekendEndBounded);
  while (weekdayCursor < end) {
    const shiftStart = new Date(weekdayCursor);
    shiftStart.setHours(18, 0, 0, 0);
    const shiftEnd = new Date(shiftStart);
    shiftEnd.setDate(shiftEnd.getDate() + 1);
    shiftEnd.setHours(6, 0, 0, 0);

    if (shiftStart >= end) break;
    if (shiftEnd > end) shiftEnd.setTime(end.getTime());

    if (shiftStart < shiftEnd) {
      const dayName = shiftStart.toLocaleDateString('fr-CH', { weekday: 'long' });
      slots.push({
        type: 'weekday',
        label: `${dayName}`,
        start: shiftStart.toISOString(),
        end: shiftEnd.toISOString()
      });
    }
    weekdayCursor.setDate(weekdayCursor.getDate() + 1);
  }
  return slots;
};
