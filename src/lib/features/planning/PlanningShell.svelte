<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Router, { push, router } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import TopNav from '../../components/navigation/TopNav.svelte';
  import PlanningRouteView from './PlanningRouteView.svelte';
  import { FUNCTIONS, FUNCTION_LABELS, WEEKEND_REQUIREMENTS, WEEKDAY_REQUIREMENTS } from '../../constants/roles.js';
  import { GRADE_OPTIONS } from '../../constants/grades.js';
  import {
    ABSENCE_COLOR,
    CALENDAR_ROW_HEIGHT,
    PAGE_KEYS,
    PRESENCE_COLOR,
    SLOT_MINUTES,
    SLOTS_PER_DAY,
    THEME_STORAGE_KEY
  } from '../../constants/app.js';
  import {
    addDays,
    addMinutes,
    formatCalendarDayHeader,
    formatHourLabel,
    formatRangeDate,
    getWeekStartMonday,
    isValidDateRange,
    overlaps,
    parseDateInputValue,
    startOfDay,
    toDateInputValue,
    toTs
  } from '../../utils/datetime.js';
  import { getGradeAcronym, getGradeBadgeTone, isKnownGrade, normalizeGradeValue } from '../../utils/grade.js';
  import {
    buildCalendarSegments,
    getShiftSlots,
    roleAssignmentPossible,
    sortDutyWeeks,
    subtractFromInterval
  } from '../../utils/scheduling.js';

  let groupNumber = '';
  let group = null;

  let firefighters = [];
  let groupMemberIds = [];
  let absences = [];
  let activeDutyWeeks = [];
  let activeWeekAbsences = [];

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
    id: '',
    start: '',
    end: ''
  };
  let dutyWeeks = [];
  let selectedDutyWeekId = '';
  let activeDutyWeekIds = [];

  let individualCalendarColumnEl;
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
  const HALF_HOUR_SLOTS = Array.from({ length: SLOTS_PER_DAY }, (_, index) => index);

  const nextId = () => {
    if (!globalThis.crypto?.randomUUID) {
      return String(Date.now() + Math.random());
    }
    return crypto.randomUUID();
  };

  const getRoleBadgeText = (code) => `${FUNCTION_LABELS[code] ?? code} (${code})`;
  const formatDutyWeekLabel = (week) => {
    if (!week || !isValidDateRange(week.start, week.end)) return 'Semaine invalide';
    return `${formatRangeDate(new Date(week.start))} → ${formatRangeDate(addDays(new Date(week.end), -1))}`;
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
  const clearIndividualSelection = () => {
    isSelectingIndividual = false;
    individualSelectionStartSlot = null;
    individualSelectionEndSlot = null;
  };
  const getCalendarFirefighterId = () => selectedIndividualFirefighterId || (groupMembers[0]?.id ?? null);
  const beginIndividualSelection = (slotIndex, event) => {
    const firefighterId = getCalendarFirefighterId();
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
  const DEFAULT_PAGE = 'dashboard';
  const getPageFromRoute = (routePath) => {
    const page = String(routePath ?? '')
      .replace(/^#?\/?/, '')
      .split('?')[0]
      .split('/')[0];
    if (PAGE_KEYS.includes(page)) return page;
    return DEFAULT_PAGE;
  };
  const getRouteFromPage = (page) => `/${page}`;

  const setActivePage = (page) => {
    if (!PAGE_KEYS.includes(page)) return;
    if (activePage === page) return;
    push(getRouteFromPage(page));
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
    dutyWeeks = [];
    selectedDutyWeekId = '';
    activeDutyWeekIds = [];
    dutyWeek = { id: '', start: '', end: '' };
    absences = [];
  };

  const updateGroupNumber = (value) => {
    groupNumber = value;
  };
  const updateGroupEditNumber = (value) => {
    groupEditNumber = value;
  };

  const updateFirefighterFormField = (field, value) => {
    firefighterForm = {
      ...firefighterForm,
      [field]: field === 'grade' ? normalizeGradeValue(value) : value
    };
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
        grade: normalizeGradeValue(firefighterForm.grade),
        fonctions: [...firefighterForm.fonctions]
      }
    ];
    firefighterForm = { nom: '', prenom: '', grade: '', fonctions: [] };
  };

  const updateFirefighterEditFormField = (field, value) => {
    firefighterEditForm = {
      ...firefighterEditForm,
      [field]: field === 'grade' ? normalizeGradeValue(value) : value
    };
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
        grade: normalizeGradeValue(firefighterEditForm.grade),
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
  const setSelectedEditFirefighter = (firefighterId) => {
    selectedEditFirefighterId = firefighterId;
  };
  const setSelectedIndividualFirefighter = (firefighterId) => {
    selectedIndividualFirefighterId = firefighterId;
  };
  const setIndividualCalendarColumnRef = (element) => {
    individualCalendarColumnEl = element;
  };

  const setCalendarCursorsFromWeek = (week) => {
    if (!week?.start) return;
    const startDate = new Date(week.start);
    if (!Number.isFinite(startDate.getTime())) return;
    globalCalendarCursor = startDate;
    individualCalendarCursor = startDate;
  };
  const selectDutyWeek = (weekId) => {
    selectedDutyWeekId = weekId;
    const selected = dutyWeeks.find((week) => week.id === weekId);
    if (!selected) {
      dutyWeek = { id: '', start: '', end: '' };
      return;
    }
    dutyWeek = { ...selected };
    setCalendarCursorsFromWeek(selected);
  };
  const startNewDutyWeek = () => {
    selectedDutyWeekId = '';
    dutyWeek = { id: '', start: '', end: '' };
  };
  const updateDutyWeekField = (field, value) => {
    dutyWeek = {
      ...dutyWeek,
      [field]: value
    };
  };
  const isAbsenceInActiveWeek = (absence) => {
    if (activeDutyWeekIds.length === 0) return false;
    if (absence.weekId) return activeDutyWeekIds.includes(absence.weekId);
    return dutyWeeks
      .filter((week) => activeDutyWeekIds.includes(week.id))
      .some((week) => overlaps(toTs(absence.start), toTs(absence.end), toTs(week.start), toTs(week.end)));
  };

  const setDutyWeek = () => {
    if (!isValidDateRange(dutyWeek.start, dutyWeek.end)) return;
    const weekId = selectedDutyWeekId || dutyWeek.id || nextId();
    const nextWeek = { id: weekId, start: dutyWeek.start, end: dutyWeek.end };
    const existing = dutyWeeks.some((week) => week.id === weekId);
    dutyWeeks = sortDutyWeeks(existing ? dutyWeeks.map((week) => (week.id === weekId ? nextWeek : week)) : [...dutyWeeks, nextWeek]);
    selectedDutyWeekId = weekId;
    dutyWeek = { ...nextWeek };
    setCalendarCursorsFromWeek(nextWeek);
  };

  const deleteDutyWeek = () => {
    const targetId = selectedDutyWeekId || dutyWeek.id;
    if (!targetId) return;
    const removedWeek = dutyWeeks.find((week) => week.id === targetId);
    dutyWeeks = dutyWeeks.filter((week) => week.id !== targetId);
    activeDutyWeekIds = activeDutyWeekIds.filter((id) => id !== targetId);
    absences = absences.filter((absence) => {
      if (absence.weekId) return absence.weekId !== targetId;
      if (!removedWeek) return true;
      return !overlaps(toTs(absence.start), toTs(absence.end), toTs(removedWeek.start), toTs(removedWeek.end));
    });
    if (dutyWeeks.length === 0) {
      selectedDutyWeekId = '';
      activeDutyWeekIds = [];
      dutyWeek = { id: '', start: '', end: '' };
      return;
    }
    const fallbackWeek = dutyWeeks[0];
    selectedDutyWeekId = fallbackWeek.id;
    if (activeDutyWeekIds.length === 0) {
      activeDutyWeekIds = [fallbackWeek.id];
    }
    dutyWeek = { ...fallbackWeek };
    setCalendarCursorsFromWeek(fallbackWeek);
  };

  const addAbsence = () => {
    if (!absenceForm.firefighterId) return;
    if (!isValidDateRange(absenceForm.start, absenceForm.end)) return;
    if (!selectedDutyWeekId || !isValidDateRange(dutyWeek.start, dutyWeek.end)) return;
    if (!overlaps(toTs(absenceForm.start), toTs(absenceForm.end), toTs(dutyWeek.start), toTs(dutyWeek.end))) return;
    absences = [...absences, { id: nextId(), weekId: selectedDutyWeekId, ...absenceForm }];
    absenceForm = { firefighterId: '', start: '', end: '' };
  };
  const updateAbsenceField = (field, value) => {
    absenceForm = {
      ...absenceForm,
      [field]: value
    };
  };

  const removeAbsence = (absenceId) => {
    absences = absences.filter((absence) => absence.id !== absenceId);
  };

  const addAbsenceFromCalendar = (start, end) => {
    const firefighterId = getCalendarFirefighterId();
    if (!firefighterId || !isValidDateRange(start, end)) {
      return;
    }
    if (!selectedDutyWeekId || !isValidDateRange(dutyWeek.start, dutyWeek.end)) {
      return;
    }
    if (!overlaps(toTs(start), toTs(end), toTs(dutyWeek.start), toTs(dutyWeek.end))) {
      return;
    }

    absences = [
      ...absences,
      {
        id: nextId(),
        weekId: selectedDutyWeekId,
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
      dutyWeeks,
      selectedDutyWeekId,
      activeDutyWeekIds,
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
    firefighters = Array.isArray(data.firefighters)
      ? data.firefighters.map((firefighter) => ({
          ...firefighter,
          grade: normalizeGradeValue(firefighter.grade)
        }))
      : [];
    const knownIds = new Set(firefighters.map((f) => f.id));
    const importedMemberIds = Array.isArray(data.groupMemberIds)
      ? data.groupMemberIds
      : Array.isArray(data.group?.memberIds)
        ? data.group.memberIds
        : [];
    groupMemberIds = importedMemberIds.filter((id) => knownIds.has(id));
    const importedWeeks = Array.isArray(data.dutyWeeks)
      ? data.dutyWeeks
          .map((week) => ({
            id: String(week?.id ?? nextId()),
            start: String(week?.start ?? ''),
            end: String(week?.end ?? '')
          }))
          .filter((week) => isValidDateRange(week.start, week.end))
      : [];
    if (importedWeeks.length > 0) {
      dutyWeeks = sortDutyWeeks(importedWeeks);
    } else if (isValidDateRange(data?.dutyWeek?.start, data?.dutyWeek?.end)) {
      dutyWeeks = [{ id: nextId(), start: data.dutyWeek.start, end: data.dutyWeek.end }];
    } else {
      dutyWeeks = [];
    }
    const weekIdSet = new Set(dutyWeeks.map((week) => week.id));
    const requestedWeekId = String(data?.selectedDutyWeekId ?? '');
    selectedDutyWeekId =
      requestedWeekId && weekIdSet.has(requestedWeekId) ? requestedWeekId : (dutyWeeks[0]?.id ?? '');
    const requestedActiveIds = Array.isArray(data?.activeDutyWeekIds)
      ? data.activeDutyWeekIds.map((id) => String(id)).filter((id) => weekIdSet.has(id))
      : [];
    activeDutyWeekIds = requestedActiveIds.length > 0 ? [...new Set(requestedActiveIds)] : (selectedDutyWeekId ? [selectedDutyWeekId] : []);
    const selectedWeek = dutyWeeks.find((week) => week.id === selectedDutyWeekId) ?? null;
    dutyWeek = selectedWeek ? { ...selectedWeek } : { id: '', start: '', end: '' };
    absences = Array.isArray(data.absences)
      ? data.absences
          .filter((absence) => knownIds.has(absence.firefighterId))
          .map((absence) => {
            const rawWeekId = absence?.weekId ? String(absence.weekId) : '';
            if (rawWeekId && weekIdSet.has(rawWeekId)) {
              return { ...absence, weekId: rawWeekId };
            }
            const matchedWeek = dutyWeeks.find((week) =>
              overlaps(toTs(absence.start), toTs(absence.end), toTs(week.start), toTs(week.end))
            );
            return matchedWeek ? { ...absence, weekId: matchedWeek.id } : { ...absence };
          })
      : [];
    if (selectedWeek) {
      setCalendarCursorsFromWeek(selectedWeek);
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
      grade: normalizeGradeValue(selectedEditFirefighter.grade),
      fonctions: [...selectedEditFirefighter.fonctions]
    };
  }
  $: {
    const weekIdSet = new Set(dutyWeeks.map((week) => week.id));
    const nextActiveWeekIds = dutyWeeks.map((week) => week.id);
    const activeWeekIdsChanged =
      nextActiveWeekIds.length !== activeDutyWeekIds.length ||
      nextActiveWeekIds.some((id, index) => activeDutyWeekIds[index] !== id);
    if (activeWeekIdsChanged) {
      activeDutyWeekIds = nextActiveWeekIds;
    }
    if (selectedDutyWeekId && !weekIdSet.has(selectedDutyWeekId)) {
      const fallbackWeek = dutyWeeks[0] ?? null;
      selectedDutyWeekId = fallbackWeek?.id ?? '';
      dutyWeek = fallbackWeek ? { ...fallbackWeek } : { id: '', start: '', end: '' };
    }
  }
  $: activeDutyWeeks = dutyWeeks;
  $: shiftSlots = sortDutyWeeks(activeDutyWeeks).flatMap((week) =>
    getShiftSlots(week.start, week.end).map((slot) => ({
      ...slot,
      weekId: week.id
    }))
  );
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
  $: activeWeekAbsences = absences.filter((absence) => isAbsenceInActiveWeek(absence));
  $: absencesByFirefighter = groupMembers
    .map((member) => ({
      id: member.id,
      member,
      count: activeWeekAbsences.filter((absence) => absence.firefighterId === member.id).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  $: calendarEvents = [
    ...shiftSlots.flatMap((slot) => {
      const slotStartMs = toTs(slot.start);
      const slotEndMs = toTs(slot.end);

      return groupMembers.flatMap((member) => {
        const memberAbsences = activeWeekAbsences
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
      const memberAbsences = activeWeekAbsences.filter((absence) => absence.firefighterId === member.id);
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
        return activeWeekAbsences.some((absence) => {
          if (absence.firefighterId !== member.id) return false;
          return overlaps(toTs(absence.start), toTs(absence.end), slotStartTs, slotEndTs);
        });
      });

      const availableMembers = groupMembers.filter((member) => {
        return !activeWeekAbsences.some((absence) => {
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

      const conflictAbsences = activeWeekAbsences
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
  const viewModel = writable({});
  const routes = {
    '/dashboard': wrap({ component: PlanningRouteView, props: { page: 'dashboard', viewModel } }),
    '/groupe': wrap({ component: PlanningRouteView, props: { page: 'groupe', viewModel } }),
    '/groupe-modifier': wrap({ component: PlanningRouteView, props: { page: 'groupe-modifier', viewModel } }),
    '/pompiers': wrap({ component: PlanningRouteView, props: { page: 'pompiers', viewModel } }),
    '/pompiers-modifier': wrap({ component: PlanningRouteView, props: { page: 'pompiers-modifier', viewModel } }),
    '/semaine': wrap({ component: PlanningRouteView, props: { page: 'semaine', viewModel } }),
    '/semaine-modifier': wrap({ component: PlanningRouteView, props: { page: 'semaine-modifier', viewModel } }),
    '/absences': wrap({ component: PlanningRouteView, props: { page: 'absences', viewModel } }),
    '/alertes': wrap({ component: PlanningRouteView, props: { page: 'alertes', viewModel } }),
    '/donnees': wrap({ component: PlanningRouteView, props: { page: 'donnees', viewModel } }),
    '/calendrier-global': wrap({ component: PlanningRouteView, props: { page: 'calendrier-global', viewModel } }),
    '/calendrier-individuel': wrap({ component: PlanningRouteView, props: { page: 'calendrier-individuel', viewModel } }),
    '*': wrap({ component: PlanningRouteView, props: { page: 'dashboard', viewModel } })
  };

  onMount(() => {
    const syncPageFromRouter = () => {
      activePage = getPageFromRoute(router.location);
    };

    const normalizedInitialPage = getPageFromRoute(router.location);
    if ((router.location ?? '') !== getRouteFromPage(normalizedInitialPage)) {
      push(getRouteFromPage(normalizedInitialPage));
    }
    syncPageFromRouter();

    const handleWindowMouseUp = () => {
      if (isSelectingIndividual) {
        commitIndividualSelection();
      }
      isSelectingIndividual = false;
    };
    const handleWindowPointerMove = (event) => {
      if (!isSelectingIndividual || activePage !== 'calendrier-individuel') return;

      const calendarColumn = individualCalendarColumnEl;
      if (!calendarColumn) return;

      const rect = calendarColumn.getBoundingClientRect();
      if (rect.height <= 0) return;

      const relativeY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height - 1);
      const slotIndex = Math.floor((relativeY / rect.height) * SLOTS_PER_DAY);

      if (slotIndex >= 0 && slotIndex < SLOTS_PER_DAY) {
        extendIndividualSelection(slotIndex);
      }
    };

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme === 'dark');
    } else {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('pointerup', handleWindowMouseUp);
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('hashchange', syncPageFromRouter);

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('pointerup', handleWindowMouseUp);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('hashchange', syncPageFromRouter);
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
    weeksTotal: dutyWeeks.length,
    slotsTotal: shiftSlots.length,
    absencesTotal: activeWeekAbsences.length,
    criticalAlerts: constraintAlerts.filter((alert) => alert.severity === 'error').length,
    warningAlerts: constraintAlerts.filter((alert) => alert.severity === 'warning').length
  };
  $: viewModel.set({
    dashboardStats,
    activeDutyWeekIds,
    roleCoverageSummary,
    absencesByFirefighter,
    getRoleBadgeText,
    getGradeAcronym,
    getGradeBadgeTone,
    groupNumber,
    group,
    updateGroupNumber,
    createGroup,
    setActivePage,
    groupEditNumber,
    updateGroupEditNumber,
    updateGroup,
    deleteGroup,
    firefighterForm,
    firefighters,
    groupMemberIds,
    FUNCTIONS,
    GRADE_OPTIONS,
    updateFirefighterFormField,
    toggleFunction,
    addFirefighter,
    updateGroupAssignment,
    openFirefighterEditor,
    selectedEditFirefighterId,
    firefighterEditForm,
    isKnownGrade,
    setSelectedEditFirefighter,
    updateFirefighterEditFormField,
    toggleEditFunction,
    updateFirefighter,
    deleteFirefighter,
    dutyWeeks,
    dutyWeek,
    selectedDutyWeekId,
    formatDutyWeekLabel,
    selectDutyWeek,
    startNewDutyWeek,
    updateDutyWeekField,
    setDutyWeek,
    deleteDutyWeek,
    absenceForm,
    groupMembers,
    activeWeekAbsences,
    updateAbsenceField,
    addAbsence,
    removeAbsence,
    constraintAlerts,
    exportJson,
    importJson,
    moveGlobalCalendar,
    globalCalendarView,
    setGlobalCalendarView,
    globalDayPicker,
    setGlobalCalendarDate,
    globalCalendarRangeLabel,
    globalColumnHeaders,
    CALENDAR_ROW_HEIGHT,
    SLOTS_PER_DAY,
    HALF_HOUR_SLOTS,
    formatHourLabel,
    globalColumnSegments,
    getGlobalSegmentStyle,
    selectedIndividualFirefighterId,
    setSelectedIndividualFirefighter,
    moveIndividualCalendar,
    individualDayPicker,
    setIndividualCalendarDate,
    individualCalendarRangeLabel,
    formatRangeDate,
    individualRange,
    isIndividualSlotSelected,
    beginIndividualSelection,
    extendIndividualSelection,
    handleIndividualSlotClick,
    individualCalendarSegments,
    getIndividualSegmentStyle,
    setIndividualCalendarColumnRef
  });
</script>

<main class:calendar-page={activePage === 'calendrier-global' || activePage === 'calendrier-individuel'}>
  <h1>Planification de piquet pompier</h1>

  <TopNav
    {activePage}
    {isDarkTheme}
    on:navigate={(event) => setActivePage(event.detail.page)}
    on:toggle-theme={toggleTheme}
  />
  <Router {routes} />
</main>
