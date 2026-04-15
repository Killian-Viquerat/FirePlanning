<script>
  import { onMount } from 'svelte';

  const FUNCTIONS = ['APR', 'CPL', 'MEA', 'EQ', 'CE'];
  const FUNCTION_LABELS = {
    APR: 'Porteur appareil respiratoire',
    CPL: 'Chauffeur point lourd',
    MEA: 'Machiniste échelle',
    EQ: 'Équipier',
    CE: 'Chef extinction'
  };
  const WEEKEND_REQUIREMENTS = { APR: 2, CPL: 1, EQ: 1, CE: 1 };
  const WEEKDAY_REQUIREMENTS = { CE: 1, CPL: 1, MEA: 1, APR: 2, EQ: 1 };
  const PRESENCE_COLOR = '#16a34a';
  const ABSENCE_COLOR = '#dc2626';
  const THEME_STORAGE_KEY = 'pompier-theme';
  const SLOT_MINUTES = 30;
  const SLOTS_PER_DAY = 48;
  const MINUTES_PER_DAY = 24 * 60;
  const CALENDAR_ROW_HEIGHT = 24;

  let groupNumber = '';
  let group = null;

  let firefighters = [];
  let groupMemberIds = [];
  let absences = [];

  let firefighterForm = {
    nom: '',
    prenom: '',
    grade: '',
    fonctions: []
  };

  let absenceForm = {
    firefighterId: '',
    start: '',
    end: ''
  };

  let dutyWeek = {
    start: '',
    end: ''
  };

  let importInput;
  let globalCalendarView = 'day';
  let globalCalendarCursor = new Date();
  let individualCalendarCursor = new Date();
  let globalCalendarRangeLabel = '';
  let individualCalendarRangeLabel = '';
  let globalDayPicker = '';
  let individualDayPicker = '';
  let isSelectingIndividual = false;
  let individualSelectionStartSlot = null;
  let individualSelectionEndSlot = null;
  let suppressNextIndividualSlotClick = false;
  const PAGE_KEYS = [
    'dashboard',
    'groupe',
    'groupe-modifier',
    'pompiers',
    'pompiers-modifier',
    'semaine',
    'semaine-modifier',
    'absences',
    'alertes',
    'donnees',
    'calendrier-global',
    'calendrier-individuel'
  ];
  let activePage = 'dashboard';
  let isDarkTheme = false;
  let selectedIndividualFirefighterId = '';
  let selectedEditFirefighter;
  let groupEditNumber = '';
  let selectedEditFirefighterId = '';
  let firefighterEditForm = {
    nom: '',
    prenom: '',
    grade: '',
    fonctions: []
  };

  const formatGroupCode = (numberValue) => `N0${String(numberValue).trim()}`;
  const toTs = (value) => new Date(value).getTime();
  const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
  const HALF_HOUR_SLOTS = Array.from({ length: SLOTS_PER_DAY }, (_, index) => index);

  const nextId = () => {
    if (!globalThis.crypto?.randomUUID) {
      return String(Date.now() + Math.random());
    }
    return crypto.randomUUID();
  };

  const isValidDateRange = (start, end) => start && end && toTs(start) < toTs(end);
  const normalizeText = (value) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const getRoleBadgeText = (code) => `${FUNCTION_LABELS[code] ?? code} (${code})`;
  const formatRangeDate = (date) =>
    date.toLocaleDateString('fr-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatCalendarDayHeader = (date, dayCount) =>
    date.toLocaleDateString('fr-CH', dayCount > 1 ? { weekday: 'short', day: '2-digit', month: '2-digit' } : { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const parseDateInputValue = (value) => {
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    return Number.isFinite(date.getTime()) ? date : null;
  };
  const formatHourLabel = (slotIndex) => {
    const hour = Math.floor((slotIndex * SLOT_MINUTES) / 60);
    const minutes = (slotIndex * SLOT_MINUTES) % 60;
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const addDays = (value, days) => {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
  };
  const addMinutes = (value, minutes) => {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  };
  const getWeekStartMonday = (value) => {
    const date = startOfDay(value);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(date, diff);
  };
  const getGlobalCalendarRange = () => {
    const anchor = startOfDay(globalCalendarCursor);
    if (globalCalendarView === 'week') {
      const start = getWeekStartMonday(anchor);
      return { start, end: addDays(start, 7), dayCount: 7 };
    }
    return { start: anchor, end: addDays(anchor, 1), dayCount: 1 };
  };
  const getIndividualCalendarRange = () => {
    const start = startOfDay(individualCalendarCursor);
    return { start, end: addDays(start, 1), dayCount: 1 };
  };
  const buildCalendarSegments = (events, rangeStart, dayCount) => {
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
  const clearIndividualSelection = () => {
    isSelectingIndividual = false;
    individualSelectionStartSlot = null;
    individualSelectionEndSlot = null;
  };
  const beginIndividualSelection = (slotIndex, event) => {
    // Use selected firefighter or first available
    const firefighterId = selectedIndividualFirefighterId || (groupMembers[0]?.id ?? null);
    if (!firefighterId) {
      return;
    }
    suppressNextIndividualSlotClick = false;
    isSelectingIndividual = true;
    individualSelectionStartSlot = slotIndex;
    individualSelectionEndSlot = slotIndex;
    event?.preventDefault?.();
  };
  const extendIndividualSelection = (slotIndex) => {
    if (!isSelectingIndividual) return;
    individualSelectionEndSlot = slotIndex;
  };
  const isIndividualSlotSelected = (slotIndex) => {
    if (individualSelectionStartSlot === null || individualSelectionEndSlot === null) return false;
    const minSlot = Math.min(individualSelectionStartSlot, individualSelectionEndSlot);
    const maxSlot = Math.max(individualSelectionStartSlot, individualSelectionEndSlot);
    return slotIndex >= minSlot && slotIndex <= maxSlot;
  };
  const commitIndividualSelection = () => {
    if (!isSelectingIndividual || individualSelectionStartSlot === null || individualSelectionEndSlot === null) {
      clearIndividualSelection();
      return;
    }
    const startSlot = Math.min(individualSelectionStartSlot, individualSelectionEndSlot);
    const endSlot = Math.max(individualSelectionStartSlot, individualSelectionEndSlot) + 1;
    const startDate = addMinutes(individualRange.start, startSlot * SLOT_MINUTES);
    const endDate = addMinutes(individualRange.start, endSlot * SLOT_MINUTES);
    suppressNextIndividualSlotClick = true;
    addAbsenceFromCalendar(startDate.toISOString(), endDate.toISOString());
    clearIndividualSelection();
  };
  const addAbsenceAtSlot = (slotIndex) => {
    const startDate = addMinutes(individualRange.start, slotIndex * SLOT_MINUTES);
    const endDate = addMinutes(startDate, SLOT_MINUTES);
    addAbsenceFromCalendar(startDate.toISOString(), endDate.toISOString());
  };
  const handleIndividualSlotClick = (slotIndex) => {
    if (suppressNextIndividualSlotClick) {
      suppressNextIndividualSlotClick = false;
      return;
    }
    addAbsenceAtSlot(slotIndex);
  };
  const getGlobalSegmentStyle = (segment) => {
    const base = `top:${segment.topPx}px;height:${segment.heightPx}px;background:${segment.backgroundColor};color:${segment.textColor};`;
    if (globalCalendarView !== 'week') {
      return `${base}left:2px;right:2px;`;
    }
    const laneCount = Math.max(Number(segment.laneCount) || 1, 1);
    const laneIndex = Math.max(0, Math.min(laneCount - 1, Number(segment.laneIndex) || 0));
    const laneWidth = 100 / laneCount;
    return `${base}left:calc(${laneIndex * laneWidth}% + 1px);width:calc(${laneWidth}% - 2px);right:auto;`;
  };
  const getIndividualSegmentStyle = (segment) =>
    `top:${segment.topPx}px;height:${segment.heightPx}px;background:${segment.backgroundColor};color:${segment.textColor};left:2px;right:2px;`;
  const getGradeBadgeTone = (grade) => {
    const normalized = normalizeText(grade);
    if (!normalized) return 'gray';
    if (normalized.includes('adjudant')) return 'green';
    if (normalized.includes('sergent')) return 'blue';
    if (normalized.includes('caporal')) return 'orange';
    if (
      normalized.includes('lieutenant') ||
      normalized.includes('capitaine') ||
      normalized.includes('commandant') ||
      normalized.includes('major') ||
      normalized.includes('colonel') ||
      normalized.includes('officier')
    ) {
      return 'red';
    }
    return 'gray';
  };
  const getPageFromHash = () => {
    const page = window.location.hash.replace('#', '');
    if (PAGE_KEYS.includes(page)) return page;
    return 'groupe';
  };

  const setActivePage = (page) => {
    if (!PAGE_KEYS.includes(page)) return;
    activePage = page;
    window.location.hash = page;
  };
  const setGlobalCalendarView = (view) => {
    globalCalendarView = view;
  };
  const moveGlobalCalendar = (direction) => {
    if (direction === 'today') {
      globalCalendarCursor = new Date();
      return;
    }
    const step = globalCalendarView === 'week' ? 7 : 1;
    globalCalendarCursor = addDays(globalCalendarCursor, direction === 'prev' ? -step : step);
  };
  const moveIndividualCalendar = (direction) => {
    if (direction === 'today') {
      individualCalendarCursor = new Date();
      return;
    }
    individualCalendarCursor = addDays(individualCalendarCursor, direction === 'prev' ? -1 : 1);
  };
  const setGlobalCalendarDate = (value) => {
    const parsed = parseDateInputValue(value);
    if (!parsed) return;
    globalCalendarCursor = parsed;
  };
  const setIndividualCalendarDate = (value) => {
    const parsed = parseDateInputValue(value);
    if (!parsed) return;
    individualCalendarCursor = parsed;
  };

  const applyTheme = (darkMode) => {
    isDarkTheme = darkMode;
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    applyTheme(!isDarkTheme);
  };

  const subtractFromInterval = (startMs, endMs, exclusions) => {
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
    }
    return segments.filter((segment) => segment.end - segment.start > 0);
  };

  const roleAssignmentPossible = (members, requirements) => {
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

  const createGroup = () => {
    if (!groupNumber.trim()) return;
    group = {
      id: nextId(),
      code: formatGroupCode(groupNumber)
    };
    groupEditNumber = groupNumber.trim();
  };

  const updateGroup = () => {
    if (!group || !groupEditNumber.trim()) return;
    group = { ...group, code: formatGroupCode(groupEditNumber) };
  };

  const deleteGroup = () => {
    group = null;
    groupNumber = '';
    groupEditNumber = '';
    groupMemberIds = [];
    absences = [];
  };

  const toggleFunction = (fonction) => {
    if (firefighterForm.fonctions.includes(fonction)) {
      firefighterForm.fonctions = firefighterForm.fonctions.filter((f) => f !== fonction);
      return;
    }
    firefighterForm.fonctions = [...firefighterForm.fonctions, fonction];
  };

  const addFirefighter = () => {
    if (!firefighterForm.nom.trim() || !firefighterForm.prenom.trim() || !firefighterForm.grade.trim()) return;
    if (firefighterForm.fonctions.length === 0) return;

    firefighters = [
      ...firefighters,
      {
        id: nextId(),
        nom: firefighterForm.nom.trim(),
        prenom: firefighterForm.prenom.trim(),
        grade: firefighterForm.grade.trim(),
        fonctions: [...firefighterForm.fonctions]
      }
    ];
    firefighterForm = { nom: '', prenom: '', grade: '', fonctions: [] };
  };

  const toggleEditFunction = (fonction) => {
    if (firefighterEditForm.fonctions.includes(fonction)) {
      firefighterEditForm.fonctions = firefighterEditForm.fonctions.filter((f) => f !== fonction);
      return;
    }
    firefighterEditForm.fonctions = [...firefighterEditForm.fonctions, fonction];
  };

  const updateFirefighter = () => {
    if (!selectedEditFirefighterId) return;
    if (!firefighterEditForm.nom.trim() || !firefighterEditForm.prenom.trim() || !firefighterEditForm.grade.trim()) return;
    if (firefighterEditForm.fonctions.length === 0) return;

    firefighters = firefighters.map((firefighter) => {
      if (firefighter.id !== selectedEditFirefighterId) return firefighter;
      return {
        ...firefighter,
        nom: firefighterEditForm.nom.trim(),
        prenom: firefighterEditForm.prenom.trim(),
        grade: firefighterEditForm.grade.trim(),
        fonctions: [...firefighterEditForm.fonctions]
      };
    });
  };

  const deleteFirefighter = () => {
    if (!selectedEditFirefighterId) return;
    firefighters = firefighters.filter((firefighter) => firefighter.id !== selectedEditFirefighterId);
    groupMemberIds = groupMemberIds.filter((id) => id !== selectedEditFirefighterId);
    absences = absences.filter((absence) => absence.firefighterId !== selectedEditFirefighterId);
    selectedEditFirefighterId = '';
    firefighterEditForm = { nom: '', prenom: '', grade: '', fonctions: [] };
  };

  const openFirefighterEditor = (firefighterId) => {
    selectedEditFirefighterId = firefighterId;
    setActivePage('pompiers-modifier');
  };

  const setDutyWeek = () => {
    if (!isValidDateRange(dutyWeek.start, dutyWeek.end)) return;
    absences = absences.filter((absence) => overlaps(toTs(absence.start), toTs(absence.end), toTs(dutyWeek.start), toTs(dutyWeek.end)));
    const startDate = new Date(dutyWeek.start);
    if (Number.isFinite(startDate.getTime())) {
      globalCalendarCursor = startDate;
      individualCalendarCursor = startDate;
    }
  };

  const deleteDutyWeek = () => {
    dutyWeek = { start: '', end: '' };
    absences = [];
  };

  const addAbsence = () => {
    if (!absenceForm.firefighterId) return;
    if (!isValidDateRange(absenceForm.start, absenceForm.end)) return;
    if (dutyWeek.start && dutyWeek.end) {
      if (!overlaps(toTs(absenceForm.start), toTs(absenceForm.end), toTs(dutyWeek.start), toTs(dutyWeek.end))) return;
    }
    absences = [...absences, { id: nextId(), ...absenceForm }];
    absenceForm = { firefighterId: '', start: '', end: '' };
  };

  const removeAbsence = (absenceId) => {
    absences = absences.filter((absence) => absence.id !== absenceId);
  };

  const addAbsenceFromCalendar = (start, end) => {
    // Use selected firefighter or first available
    const firefighterId = selectedIndividualFirefighterId || (groupMembers[0]?.id ?? null);
    if (!firefighterId || !isValidDateRange(start, end)) {
      return;
    }

    absences = [
      ...absences,
      {
        id: nextId(),
        firefighterId: firefighterId,
        start,
        end
      }
    ];
  };

  const exportJson = () => {
    const payload = {
      group,
      firefighters,
      groupMemberIds,
      dutyWeek,
      absences
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'piquet-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const content = await file.text();
    const data = JSON.parse(content);

    group = data.group || null;
    firefighters = Array.isArray(data.firefighters) ? data.firefighters : [];
    const knownIds = new Set(firefighters.map((f) => f.id));
    groupMemberIds = Array.isArray(data.groupMemberIds) ? data.groupMemberIds.filter((id) => knownIds.has(id)) : [];
    dutyWeek = data.dutyWeek || { start: '', end: '' };
    absences = Array.isArray(data.absences) ? data.absences.filter((a) => knownIds.has(a.firefighterId)) : [];
    if (dutyWeek.start) {
      const startDate = new Date(dutyWeek.start);
      if (Number.isFinite(startDate.getTime())) {
        globalCalendarCursor = startDate;
        individualCalendarCursor = startDate;
      }
    }
    event.target.value = '';
  };

  const updateGroupAssignment = (firefighterId, checked) => {
    if (checked) {
      groupMemberIds = [...new Set([...groupMemberIds, firefighterId])];
      return;
    }
    groupMemberIds = groupMemberIds.filter((id) => id !== firefighterId);
  };

  const getShiftSlots = (startRaw, endRaw) => {
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

  $: groupMembers = firefighters.filter((firefighter) => groupMemberIds.includes(firefighter.id));
  $: if (group && !groupEditNumber) {
    groupEditNumber = group.code.startsWith('N0') ? group.code.slice(2) : group.code;
  }
  $: if (!group) {
    groupEditNumber = '';
  }
  $: if (firefighters.length > 0 && !firefighters.some((firefighter) => firefighter.id === selectedEditFirefighterId)) {
    selectedEditFirefighterId = firefighters[0].id;
  }
  $: if (firefighters.length === 0) {
    selectedEditFirefighterId = '';
  }
  $: selectedEditFirefighter = firefighters.find((firefighter) => firefighter.id === selectedEditFirefighterId);
  $: if (selectedEditFirefighter) {
    firefighterEditForm = {
      nom: selectedEditFirefighter.nom,
      prenom: selectedEditFirefighter.prenom,
      grade: selectedEditFirefighter.grade,
      fonctions: [...selectedEditFirefighter.fonctions]
    };
  }
  $: shiftSlots = getShiftSlots(dutyWeek.start, dutyWeek.end);
  $: if (groupMembers.length > 0 && !groupMembers.some((member) => member.id === selectedIndividualFirefighterId)) {
    selectedIndividualFirefighterId = groupMembers[0].id;
  }
  $: if (groupMembers.length === 0) {
    selectedIndividualFirefighterId = '';
  }
  $: roleCoverageSummary = FUNCTIONS.map((role) => ({
    role,
    count: groupMembers.filter((member) => member.fonctions.includes(role)).length
  }));
  $: absencesByFirefighter = groupMembers
    .map((member) => ({
      id: member.id,
      member,
      count: absences.filter((absence) => absence.firefighterId === member.id).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  $: calendarEvents = [
    ...shiftSlots.flatMap((slot) => {
      const slotStartMs = toTs(slot.start);
      const slotEndMs = toTs(slot.end);

      return groupMembers.flatMap((member) => {
        const memberAbsences = absences
          .filter((absence) => absence.firefighterId === member.id)
          .sort((a, b) => toTs(a.start) - toTs(b.start));

        const slotAbsenceSegments = memberAbsences
          .map((absence) => ({
            absenceId: absence.id,
            start: Math.max(slotStartMs, toTs(absence.start)),
            end: Math.min(slotEndMs, toTs(absence.end))
          }))
          .filter((segment) => segment.end > segment.start);

        const presenceEvents = subtractFromInterval(slotStartMs, slotEndMs, slotAbsenceSegments).map((segment) => ({
          id: nextId(),
          title: `${member.prenom} - Permanence`,
          start: new Date(segment.start).toISOString(),
          end: new Date(segment.end).toISOString(),
          backgroundColor: PRESENCE_COLOR,
          borderColor: PRESENCE_COLOR,
          classNames: ['presence-event'],
          extendedProps: {
            eventType: 'presence',
            firefighterId: member.id
          }
        }));

        const absenceEvents = slotAbsenceSegments.map((segment) => ({
          id: nextId(),
          title: `${member.prenom} - Absent`,
          start: new Date(segment.start).toISOString(),
          end: new Date(segment.end).toISOString(),
          backgroundColor: ABSENCE_COLOR,
          borderColor: ABSENCE_COLOR,
          classNames: ['absence-event'],
          extendedProps: {
            eventType: 'absence',
            firefighterId: member.id,
            absenceId: segment.absenceId
          }
        }));

        return [...presenceEvents, ...absenceEvents];
      });
    }),
    // Add orphan absence parts: absences that don't overlap with any shift slot, OR parts that extend beyond slots
    ...groupMembers.flatMap((member) => {
      const memberAbsences = absences.filter((absence) => absence.firefighterId === member.id);
      const orphanParts = [];

      for (const absence of memberAbsences) {
        const absenceStart = toTs(absence.start);
        const absenceEnd = toTs(absence.end);

        // Find all slot overlaps for this absence
        const overlappingSlots = shiftSlots
          .map((slot) => ({
            start: toTs(slot.start),
            end: toTs(slot.end)
          }))
          .filter((slot) => overlaps(absenceStart, absenceEnd, slot.start, slot.end));

        if (overlappingSlots.length === 0) {
          // No slot overlap - entire absence is orphan
          orphanParts.push({ start: absenceStart, end: absenceEnd, absenceId: absence.id });
        } else {
          // Find parts of absence that extend beyond all slots
          const coveredIntervals = overlappingSlots.map((slot) => ({
            start: Math.max(absenceStart, slot.start),
            end: Math.min(absenceEnd, slot.end)
          }));

          // Compute uncovered intervals within the absence
          const uncovered = [];
          let currentPos = absenceStart;

          for (const covered of coveredIntervals.sort((a, b) => a.start - b.start)) {
            if (currentPos < covered.start) {
              uncovered.push({ start: currentPos, end: covered.start, absenceId: absence.id });
            }
            currentPos = Math.max(currentPos, covered.end);
          }

          if (currentPos < absenceEnd) {
            uncovered.push({ start: currentPos, end: absenceEnd, absenceId: absence.id });
          }

          orphanParts.push(...uncovered);
        }
      }

      return orphanParts.map((part) => ({
        id: nextId(),
        title: `${member.prenom} - Absent`,
        start: new Date(part.start).toISOString(),
        end: new Date(part.end).toISOString(),
        backgroundColor: ABSENCE_COLOR,
        borderColor: ABSENCE_COLOR,
        classNames: ['absence-event'],
        extendedProps: {
          eventType: 'absence',
          firefighterId: member.id,
          absenceId: part.absenceId
        }
      }));
    })
  ];

  $: individualCalendarEvents = calendarEvents.filter((event) => event.extendedProps?.firefighterId === selectedIndividualFirefighterId);

  $: constraintAlerts = shiftSlots
    .map((slot) => {
      const requirements = slot.type === 'weekend' ? WEEKEND_REQUIREMENTS : WEEKDAY_REQUIREMENTS;
      const requiredTotal = Object.values(requirements).reduce((sum, count) => sum + count, 0);
      const slotStartTs = toTs(slot.start);
      const slotEndTs = toTs(slot.end);
      const groupMemberIdSet = new Set(groupMembers.map((member) => member.id));

      const absentMembers = groupMembers.filter((member) => {
        return absences.some((absence) => {
          if (absence.firefighterId !== member.id) return false;
          return overlaps(toTs(absence.start), toTs(absence.end), slotStartTs, slotEndTs);
        });
      });

      const availableMembers = groupMembers.filter((member) => {
        return !absences.some((absence) => {
          if (absence.firefighterId !== member.id) return false;
          return overlaps(toTs(absence.start), toTs(absence.end), slotStartTs, slotEndTs);
        });
      });

      const perRoleCoverage = Object.entries(requirements).map(([role, count]) => {
        const availableForRole = availableMembers.filter((member) => member.fonctions.includes(role)).length;
        return { role, expected: count, available: availableForRole };
      });
      const rolePresenceItems = perRoleCoverage.map((entry) => ({
        ...entry,
        label: getRoleBadgeText(entry.role)
      }));

      const missingRoleItems = perRoleCoverage.filter((entry) => entry.available < entry.expected);
      const assignmentPossible = availableMembers.length >= requiredTotal && roleAssignmentPossible(availableMembers, requirements);
      const hasError = missingRoleItems.length > 0 || !assignmentPossible;
      const isMinimumCoverage =
        !hasError && (availableMembers.length === requiredTotal || perRoleCoverage.some((entry) => entry.available === entry.expected));

      if (!hasError && !isMinimumCoverage) return null;

      const roleDetail = hasError
        ? missingRoleItems.map((item) => `${getRoleBadgeText(item.role)} ${item.available}/${item.expected}`).join(', ')
        : 'Contraintes respectées au minimum';

      const missingCandidates = missingRoleItems.map((item) => ({
        role: item.role,
        members: absentMembers
          .filter((member) => member.fonctions.includes(item.role))
          .map((member) => ({
            id: member.id,
            prenom: member.prenom,
            nom: member.nom,
            grade: member.grade
          }))
      }));

      const conflictAbsences = absences
        .filter((absence) => groupMemberIdSet.has(absence.firefighterId))
        .filter((absence) => overlaps(toTs(absence.start), toTs(absence.end), slotStartTs, slotEndTs))
        .map((absence) => {
          const member = firefighters.find((firefighter) => firefighter.id === absence.firefighterId);
          const overlapStart = new Date(Math.max(toTs(absence.start), slotStartTs));
          const overlapEnd = new Date(Math.min(toTs(absence.end), slotEndTs));
          return {
            member: member
              ? { id: member.id, prenom: member.prenom, nom: member.nom, grade: member.grade }
              : null,
            startLabel: overlapStart.toLocaleString('fr-CH'),
            endLabel: overlapEnd.toLocaleString('fr-CH')
          };
        });

      return {
        severity: hasError ? 'error' : 'warning',
        slotLabel: slot.label,
        period: `${new Date(slot.start).toLocaleString('fr-CH')} - ${new Date(slot.end).toLocaleString('fr-CH')}`,
        total: `${availableMembers.length}/${requiredTotal}`,
        detail: roleDetail,
        rolePresenceItems,
        missingCandidates,
        conflictAbsences
      };
    })
    .filter(Boolean);

  let globalRange = getGlobalCalendarRange();
  let individualRange = getIndividualCalendarRange();
  let globalCalendarDays = [globalRange.start];
  let globalCalendarSegments = [[]];
  let globalColumnHeaders = [];
  let globalColumnSegments = [[]];
  let individualCalendarSegments = [[]];

  onMount(() => {
    const handleHashChange = () => {
      activePage = getPageFromHash();
    };
    const handleWindowMouseUp = () => {
      if (isSelectingIndividual) {
        commitIndividualSelection();
      }
    };
    const handleWindowPointerMove = (event) => {
      if (!isSelectingIndividual || activePage !== 'calendrier-individuel') return;
      
      // Find the calendar day column
      const calendarColumn = document.querySelector('.calendar-day-column');
      if (!calendarColumn) return;
      
      const rect = calendarColumn.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      
      // Calculate slot index from Y position
      const relativeY = event.clientY - rect.top;
      const slotIndex = Math.floor((relativeY / rect.height) * SLOTS_PER_DAY);
      
      if (slotIndex >= 0 && slotIndex < SLOTS_PER_DAY) {
        extendIndividualSelection(slotIndex);
      }
    };

    // Initialize demo data if nothing is loaded
    if (firefighters.length === 0) {
      firefighters = [
        { id: 'demo-ff1', grade: 'Sapeur', nom: 'Martin', prenom: 'Jean', fonctions: [] },
        { id: 'demo-ff2', grade: 'Sergent', nom: 'Dupont', prenom: 'Pierre', fonctions: [] }
      ];
      groupMemberIds = ['demo-ff1', 'demo-ff2'];
      group = { id: 'demo-group', name: 'Démo', code: 'DEMO', memberIds: groupMemberIds };
      dutyWeek = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      console.log('📦 Demo data initialized');
    }

    activePage = getPageFromHash();
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme === 'dark');
    } else {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('pointerup', handleWindowMouseUp);
    window.addEventListener('pointermove', handleWindowPointerMove);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('pointerup', handleWindowMouseUp);
      window.removeEventListener('pointermove', handleWindowPointerMove);
    };
  });

  $: globalRange = (globalCalendarCursor, globalCalendarView, getGlobalCalendarRange());
  $: individualRange = (individualCalendarCursor, getIndividualCalendarRange());
  $: globalCalendarDays = Array.from({ length: globalRange.dayCount }, (_, index) => addDays(globalRange.start, index));
  $: globalCalendarSegments = buildCalendarSegments(calendarEvents, globalRange.start, globalRange.dayCount);
  $: if (globalCalendarView === 'day') {
    if (groupMembers.length === 0) {
      globalColumnHeaders = [{ label: 'Aucun pompier', member: null }];
      globalColumnSegments = [[]];
    } else {
      globalColumnHeaders = groupMembers.map((member) => ({
        label: `${member.prenom} ${member.nom}`,
        member
      }));
      globalColumnSegments = groupMembers.map((member) => {
        const memberEvents = calendarEvents.filter((event) => event.extendedProps?.firefighterId === member.id);
        return buildCalendarSegments(memberEvents, globalRange.start, 1)[0] ?? [];
      });
    }
  } else {
    globalColumnHeaders = globalCalendarDays.map((day) => ({
      label: formatCalendarDayHeader(day, globalRange.dayCount),
      member: null
    }));
    const memberIndexById = new Map(groupMembers.map((member, index) => [member.id, index]));
    const laneCount = Math.max(groupMembers.length, 1);
    globalColumnSegments = globalCalendarSegments.map((segments) =>
      segments.map((segment) => ({
        ...segment,
        laneIndex: memberIndexById.get(segment.firefighterId) ?? 0,
        laneCount
      }))
    );
  }
  $: individualCalendarSegments = buildCalendarSegments(individualCalendarEvents, individualRange.start, 1);
  $: globalCalendarRangeLabel =
    globalRange.dayCount === 1
      ? formatRangeDate(globalRange.start)
      : `${formatRangeDate(globalRange.start)} → ${formatRangeDate(addDays(globalRange.end, -1))}`;
  $: individualCalendarRangeLabel = formatRangeDate(individualRange.start);
  $: globalDayPicker = toDateInputValue(globalRange.start);
  $: individualDayPicker = toDateInputValue(individualRange.start);
  $: dashboardStats = {
    groupCode: group?.code ?? 'Aucun groupe',
    firefightersTotal: firefighters.length,
    membersTotal: groupMembers.length,
    weekDefined: isValidDateRange(dutyWeek.start, dutyWeek.end),
    slotsTotal: shiftSlots.length,
    absencesTotal: absences.length,
    criticalAlerts: constraintAlerts.filter((alert) => alert.severity === 'error').length,
    warningAlerts: constraintAlerts.filter((alert) => alert.severity === 'warning').length
  };
</script>

<main class:calendar-page={activePage === 'calendrier-global' || activePage === 'calendrier-individuel'}>
  <h1>Planification de piquet pompier</h1>

  <nav class="top-nav">
    <button class:active={activePage === 'dashboard'} on:click={() => setActivePage('dashboard')}>Dashboard</button>
    <button class:active={activePage === 'groupe'} on:click={() => setActivePage('groupe')}>Groupe</button>
    <button class:active={activePage === 'pompiers'} on:click={() => setActivePage('pompiers')}>Pompiers</button>
    <button class:active={activePage === 'semaine'} on:click={() => setActivePage('semaine')}>Semaine</button>
    <button class:active={activePage === 'absences'} on:click={() => setActivePage('absences')}>Absences</button>
    <button class:active={activePage === 'alertes'} on:click={() => setActivePage('alertes')}>Alertes</button>
    <button class:active={activePage === 'donnees'} on:click={() => setActivePage('donnees')}>Import/Export</button>
    <button class:active={activePage === 'calendrier-global'} on:click={() => setActivePage('calendrier-global')}>Calendrier global</button>
    <button class:active={activePage === 'calendrier-individuel'} on:click={() => setActivePage('calendrier-individuel')}>Calendrier individuel</button>
    <button class="theme-toggle" on:click={toggleTheme}>
      {isDarkTheme ? 'White theme' : 'Black theme'}
    </button>
  </nav>

  {#if activePage === 'dashboard'}
    <section class="card">
      <h2>Dashboard</h2>
      <div class="dashboard-grid">
        <article class="dashboard-tile"><strong>Groupe</strong><span>{dashboardStats.groupCode}</span></article>
        <article class="dashboard-tile"><strong>Pompiers</strong><span>{dashboardStats.firefightersTotal}</span></article>
        <article class="dashboard-tile"><strong>Membres de groupe</strong><span>{dashboardStats.membersTotal}</span></article>
        <article class="dashboard-tile"><strong>Semaine définie</strong><span>{dashboardStats.weekDefined ? 'Oui' : 'Non'}</span></article>
        <article class="dashboard-tile"><strong>Créneaux</strong><span>{dashboardStats.slotsTotal}</span></article>
        <article class="dashboard-tile"><strong>Absences</strong><span>{dashboardStats.absencesTotal}</span></article>
        <article class="dashboard-tile"><strong>Alertes critiques</strong><span>{dashboardStats.criticalAlerts}</span></article>
        <article class="dashboard-tile"><strong>Warnings</strong><span>{dashboardStats.warningAlerts}</span></article>
      </div>

      <h2>Couverture des rôles (membres de groupe)</h2>
      <div class="checks">
        {#each roleCoverageSummary as roleItem}
          <span class="role-badge">{getRoleBadgeText(roleItem.role)}: {roleItem.count}</span>
        {/each}
      </div>

      <h2>Absences par pompier</h2>
      {#if absencesByFirefighter.length === 0}
        <p>Aucune absence enregistrée.</p>
      {:else}
        <div class="list">
          {#each absencesByFirefighter as item}
            <article>
              <span class="inline-flex items-center gap-2">
                <span class={`grade-badge ${getGradeBadgeTone(item.member.grade)}`}>{item.member.grade}</span>
                <strong>{item.member.prenom} {item.member.nom}</strong>
              </span>
              <span>{item.count} absence(s)</span>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if activePage === 'groupe'}
    <section class="card">
      <h2>Groupe de piquet</h2>
      <div class="row">
        <label>
          Numéro de groupe
          <input type="text" bind:value={groupNumber} placeholder="Ex: 1" />
        </label>
        <button on:click={createGroup}>Créer le groupe</button>
        {#if group}
          <button on:click={() => setActivePage('groupe-modifier')}>Modifier ce groupe</button>
        {/if}
      </div>
      {#if group}
        <p class="ok">Groupe actif: <strong>{group.code}</strong></p>
      {/if}
    </section>
  {/if}

  {#if activePage === 'groupe-modifier'}
    <section class="card">
      <h2>Modifier / Supprimer groupe</h2>
      <div class="row">
        <button on:click={() => setActivePage('groupe')}>Retour groupe</button>
      </div>
      {#if !group}
        <p>Aucun groupe actif à modifier.</p>
      {:else}
        <div class="row">
          <label>
            Numéro de groupe
            <input type="text" bind:value={groupEditNumber} placeholder="Ex: 1" />
          </label>
          <button on:click={updateGroup}>Mettre à jour</button>
          <button class="button-danger" on:click={deleteGroup}>Supprimer groupe</button>
        </div>
        <small>Code actuel: {group.code}</small>
      {/if}
    </section>
  {/if}

  {#if activePage === 'pompiers'}
    <section class="card">
      <h2>Sapeurs pompiers</h2>
      <div class="grid">
        <label>Nom <input type="text" bind:value={firefighterForm.nom} /></label>
        <label>Prénom <input type="text" bind:value={firefighterForm.prenom} /></label>
        <label>Grade <input type="text" bind:value={firefighterForm.grade} /></label>
      </div>

      <p>Fonctions:</p>
      <div class="checks">
        {#each FUNCTIONS as fonction}
          <label class="check">
            <input
              type="checkbox"
              checked={firefighterForm.fonctions.includes(fonction)}
              on:change={() => toggleFunction(fonction)}
            />
            <span class="role-badge">{getRoleBadgeText(fonction)}</span>
          </label>
        {/each}
      </div>
      <button on:click={addFirefighter}>Ajouter le pompier</button>

      <h2>Affectation au groupe {group?.code ?? ''}</h2>
      {#if firefighters.length === 0}
        <p>Ajoutez d'abord des pompiers.</p>
      {:else}
        <div class="checks">
          {#each firefighters as firefighter}
            <label class="check">
              <input
                type="checkbox"
                checked={groupMemberIds.includes(firefighter.id)}
                on:change={(event) => updateGroupAssignment(firefighter.id, event.currentTarget.checked)}
              />
              <span class={`grade-badge ${getGradeBadgeTone(firefighter.grade)}`}>{firefighter.grade}</span>
              <span>{firefighter.prenom} {firefighter.nom}</span>
            </label>
          {/each}
        </div>
      {/if}

      <div class="list">
        {#if firefighters.length === 0}
          <p>Aucun pompier.</p>
        {:else}
          {#each firefighters as firefighter}
            <button class="list-link" on:click={() => openFirefighterEditor(firefighter.id)}>
              <span class="inline-flex items-center gap-2">
                <span class={`grade-badge ${getGradeBadgeTone(firefighter.grade)}`}>{firefighter.grade}</span>
                <strong>{firefighter.prenom} {firefighter.nom}</strong>
              </span>
              <span class="ml-2 inline-flex flex-wrap gap-1 align-middle">
                {#each firefighter.fonctions as roleCode}
                  <span class="role-badge">{getRoleBadgeText(roleCode)}</span>
                {/each}
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </section>
  {/if}

  {#if activePage === 'pompiers-modifier'}
    <section class="card">
      <h2>Modifier / Supprimer pompier</h2>
      <div class="row">
        <button on:click={() => setActivePage('pompiers')}>Retour pompiers</button>
      </div>
      {#if firefighters.length === 0}
        <p>Aucun pompier à modifier.</p>
      {:else}
        <div class="row">
          <label>
            Pompier
            <select bind:value={selectedEditFirefighterId}>
              {#each firefighters as firefighter}
                <option value={firefighter.id}>[{firefighter.grade}] {firefighter.prenom} {firefighter.nom}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="grid">
          <label>Nom <input type="text" bind:value={firefighterEditForm.nom} /></label>
          <label>Prénom <input type="text" bind:value={firefighterEditForm.prenom} /></label>
          <label>Grade <input type="text" bind:value={firefighterEditForm.grade} /></label>
        </div>

        <p>Fonctions:</p>
        <div class="checks">
          {#each FUNCTIONS as fonction}
            <label class="check">
              <input
                type="checkbox"
                checked={firefighterEditForm.fonctions.includes(fonction)}
                on:change={() => toggleEditFunction(fonction)}
              />
              <span class="role-badge">{getRoleBadgeText(fonction)}</span>
            </label>
          {/each}
        </div>

        <div class="row">
          <button on:click={updateFirefighter}>Mettre à jour</button>
          <button class="button-danger" on:click={deleteFirefighter}>Supprimer pompier</button>
        </div>
      {/if}
    </section>
  {/if}

  {#if activePage === 'semaine'}
    <section class="card">
      <h2>Semaine de piquet</h2>
      <div class="row">
        <label>Début <input type="datetime-local" bind:value={dutyWeek.start} /></label>
        <label>Fin <input type="datetime-local" bind:value={dutyWeek.end} /></label>
        <button on:click={setDutyWeek}>Définir la semaine</button>
        <button on:click={() => setActivePage('semaine-modifier')}>Modifier la semaine</button>
      </div>
      <small>Format recommandé: vendredi 18:00 → lundi suivant 06:00.</small>
    </section>
  {/if}

  {#if activePage === 'semaine-modifier'}
    <section class="card">
      <h2>Modifier / Supprimer semaine</h2>
      <div class="row">
        <button on:click={() => setActivePage('semaine')}>Retour semaine</button>
      </div>
      <div class="row">
        <label>Début <input type="datetime-local" bind:value={dutyWeek.start} /></label>
        <label>Fin <input type="datetime-local" bind:value={dutyWeek.end} /></label>
        <button on:click={setDutyWeek}>Mettre à jour</button>
        <button class="button-danger" on:click={deleteDutyWeek}>Supprimer semaine</button>
      </div>
      <small>La suppression de la semaine retire aussi les absences.</small>
    </section>
  {/if}

  {#if activePage === 'absences'}
    <section class="card">
      <h2>Absences</h2>
      <div class="row">
        <label>
          Sapeur
          <select bind:value={absenceForm.firefighterId}>
            <option value="">Choisir...</option>
            {#each groupMembers as member}
              <option value={member.id}>[{member.grade}] {member.prenom} {member.nom}</option>
            {/each}
          </select>
        </label>
        <label>Début <input type="datetime-local" bind:value={absenceForm.start} /></label>
        <label>Fin <input type="datetime-local" bind:value={absenceForm.end} /></label>
        <button on:click={addAbsence}>Ajouter absence</button>
      </div>
      <div class="list">
        {#if absences.length === 0}
          <p>Aucune absence.</p>
        {:else}
          {#each absences as absence}
            {@const member = firefighters.find((f) => f.id === absence.firefighterId)}
            <article>
              <span class="inline-flex items-center gap-2">
                <span class={`grade-badge ${getGradeBadgeTone(member?.grade ?? '')}`}>{member?.grade ?? 'N/A'}</span>
                <span>{member?.prenom} {member?.nom}: {new Date(absence.start).toLocaleString('fr-CH')} - {new Date(absence.end).toLocaleString('fr-CH')}</span>
              </span>
              <button on:click={() => removeAbsence(absence.id)}>Supprimer</button>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  {/if}

  {#if activePage === 'alertes'}
    <section class="card">
      <h2>Alertes de contraintes</h2>
      {#if constraintAlerts.length === 0}
        <p class="ok">Toutes les contraintes sont respectées pour les créneaux définis.</p>
      {:else}
        <div class="alerts">
          {#each constraintAlerts as alert}
            <article class={`alert-card ${alert.severity}`}>
              <strong>{alert.slotLabel}</strong> ({alert.period}) - disponibles: {alert.total}<br />
              <span>{alert.severity === 'warning' ? 'Warning' : 'Alerte critique'}</span><br />
              <span class="inline-flex flex-wrap items-center gap-2">
                Présence par rôle:
                {#each alert.rolePresenceItems as roleItem}
                  <span class="role-badge">{roleItem.label} {roleItem.available}/{roleItem.expected}</span>
                {/each}
              </span><br />
              <span>Rôles manquants: {alert.detail}</span><br />
              {#if alert.conflictAbsences.length > 0}
                {#each alert.conflictAbsences as conflict}
                  <span class="inline-flex items-center gap-2">
                    Conflit absence:
                    {#if conflict.member}
                      <span class={`grade-badge ${getGradeBadgeTone(conflict.member.grade)}`}>{conflict.member.grade}</span>
                      <span>{conflict.member.prenom} {conflict.member.nom}</span>
                    {:else}
                      <span>Inconnu</span>
                    {/if}
                    <span>({conflict.startLabel} - {conflict.endLabel})</span>
                  </span><br />
                {/each}
              {/if}
              {#if alert.missingCandidates.length > 0}
                {#each alert.missingCandidates as candidate}
                  <span>
                    Absents pouvant couvrir <span class="role-badge">{getRoleBadgeText(candidate.role)}</span>:
                    {#if candidate.members.length > 0}
                      {#each candidate.members as person, idx}
                        <span class={`grade-badge ${getGradeBadgeTone(person.grade)}`}>{person.grade}</span>
                        <span>{person.prenom} {person.nom}</span>{#if idx < candidate.members.length - 1}, {/if}
                      {/each}
                    {:else}
                      aucun
                    {/if}
                  </span><br />
                {/each}
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if activePage === 'donnees'}
    <section class="card">
      <h2>Import / Export JSON</h2>
      <div class="row">
        <button on:click={exportJson}>Exporter JSON</button>
        <button on:click={() => importInput.click()}>Importer JSON</button>
        <input bind:this={importInput} type="file" accept="application/json" hidden on:change={importJson} />
      </div>
    </section>
  {/if}

  <section class="card calendar-card" class:page-hidden={activePage !== 'calendrier-global'}>
      <div class="calendar-head">
        <div>
          <h2>Calendrier global (non éditable)</h2>
          <small>Vue complète de tout le groupe. Modification des absences désactivée.</small>
        </div>
        <span class="calendar-badge">Lecture seule</span>
      </div>
      <div class="calendar-controls">
        <div class="inline-flex gap-2">
          <button type="button" on:click={() => moveGlobalCalendar('prev')}>Précédent</button>
          <button type="button" on:click={() => moveGlobalCalendar('today')}>Aujourd'hui</button>
          <button type="button" on:click={() => moveGlobalCalendar('next')}>Suivant</button>
        </div>
        <div class="inline-flex gap-2">
          <button type="button" class:active={globalCalendarView === 'day'} on:click={() => setGlobalCalendarView('day')}>Jour</button>
          <button type="button" class:active={globalCalendarView === 'week'} on:click={() => setGlobalCalendarView('week')}>Semaine</button>
        </div>
        {#if globalCalendarView === 'day'}
          <label class="calendar-date-picker">
            Date
            <input type="date" value={globalDayPicker} on:change={(event) => setGlobalCalendarDate(event.currentTarget.value)} />
          </label>
        {/if}
        <span class="calendar-range">{globalCalendarRangeLabel}</span>
      </div>
      <div class="calendar-frame">
        <div
          class="calendar-host custom-calendar-grid"
          style={`--calendar-row-height:${CALENDAR_ROW_HEIGHT}px; --calendar-rows:${SLOTS_PER_DAY}; --calendar-days:${globalColumnHeaders.length};`}
        >
          <div class="time-corner"></div>
          {#each globalColumnHeaders as header}
            <div class={`calendar-day-header ${header.member ? 'member-header' : ''}`}>
              {#if header.member}
                <span class={`grade-badge ${getGradeBadgeTone(header.member.grade)}`}>{header.member.grade}</span>
                <span class="calendar-member-name">{header.member.prenom} {header.member.nom}</span>
              {:else}
                {header.label}
              {/if}
            </div>
          {/each}

          <div class="time-axis">
            {#each HALF_HOUR_SLOTS as slot}
              <div class="time-axis-slot">{slot % 2 === 0 ? formatHourLabel(slot) : ''}</div>
            {/each}
          </div>

          {#each globalColumnHeaders as _header, dayIndex}
            <div class="calendar-day-column">
              {#each HALF_HOUR_SLOTS as _slot}
                <div class="calendar-slot-line"></div>
              {/each}
              {#each globalColumnSegments[dayIndex] ?? [] as segment}
                <div
                  class={`calendar-event-block ${segment.eventType === 'absence' ? 'absence' : 'presence'}`}
                  style={getGlobalSegmentStyle(segment)}
                  title={segment.title}
                >
                  {segment.title}
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
  </section>

  <section class="card calendar-card" class:page-hidden={activePage !== 'calendrier-individuel'}>
      <div class="calendar-head">
        <h2>Calendrier individuel (édition des absences)</h2>
        <span class="calendar-badge">Édition active</span>
      </div>
      <div class="row">
        <label>
          Ajouter une absence (clic-glisser) pour
          <select bind:value={selectedIndividualFirefighterId}>
            <option value="">Choisir un pompier...</option>
            {#each groupMembers as member}
              <option value={member.id}>[{member.grade}] {member.prenom} {member.nom}</option>
            {/each}
          </select>
        </label>
        <small>Astuce: cliquez (30 min) ou cliquez-glissez pour créer une absence. Cliquez un bloc rouge pour le supprimer.</small>
      </div>
      <div class="calendar-controls">
        <div class="inline-flex gap-2">
          <button type="button" on:click={() => moveIndividualCalendar('prev')}>Précédent</button>
          <button type="button" on:click={() => moveIndividualCalendar('today')}>Aujourd'hui</button>
          <button type="button" on:click={() => moveIndividualCalendar('next')}>Suivant</button>
        </div>
        <label class="calendar-date-picker">
          Date
          <input type="date" value={individualDayPicker} on:change={(event) => setIndividualCalendarDate(event.currentTarget.value)} />
        </label>
        <span class="calendar-range">{individualCalendarRangeLabel}</span>
      </div>
      <div class="calendar-frame">
        <div
          class="calendar-host custom-calendar-grid"
          style={`--calendar-row-height:${CALENDAR_ROW_HEIGHT}px; --calendar-rows:${SLOTS_PER_DAY}; --calendar-days:1;`}
        >
          <div class="time-corner"></div>
          <div class="calendar-day-header">{formatRangeDate(individualRange.start)}</div>

          <div class="time-axis">
            {#each HALF_HOUR_SLOTS as slot}
              <div class="time-axis-slot">{slot % 2 === 0 ? formatHourLabel(slot) : ''}</div>
            {/each}
          </div>

          <div class="calendar-day-column">
            {#each HALF_HOUR_SLOTS as slot}
              <button
                type="button"
                class="calendar-slot-line selectable"
                class:selected={isIndividualSlotSelected(slot)}
                aria-label={`Créer une absence à partir de ${formatHourLabel(slot)}`}
                on:pointerdown={(event) => beginIndividualSelection(slot, event)}
                on:click={() => handleIndividualSlotClick(slot)}
              ></button>
            {/each}
            {#each individualCalendarSegments[0] ?? [] as segment}
              {#if segment.eventType === 'absence'}
                <button
                  type="button"
                  class="calendar-event-block absence removable"
                  style={getIndividualSegmentStyle(segment)}
                  title="Cliquez pour supprimer cette absence"
                  on:mousedown|stopPropagation
                  on:click|stopPropagation={() => segment.absenceId && removeAbsence(segment.absenceId)}
                >
                  {segment.title}
                </button>
              {:else}
                <div class="calendar-event-block presence" style={getIndividualSegmentStyle(segment)} title={segment.title}>
                  {segment.title}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
  </section>
</main>
