<script>
  import GradeBadge from '../components/common/GradeBadge.svelte';

  export let moveGlobalCalendar = () => {};
  export let selectedDutyWeekId = '';
  export let dutyWeeks = [];
  export let selectDutyWeek = () => {};
  export let formatDutyWeekLabel = () => '';
  export let globalCalendarView = 'day';
  export let setGlobalCalendarView = () => {};
  export let globalDayPicker = '';
  export let setGlobalCalendarDate = () => {};
  export let globalCalendarRangeLabel = '';
  export let globalColumnHeaders = [];
  export let CALENDAR_ROW_HEIGHT = 32;
  export let SLOTS_PER_DAY = 48;
  export let HALF_HOUR_SLOTS = [];
  export let formatHourLabel = (slot) => String(slot);
  export let globalColumnSegments = [];
  export let getGlobalSegmentStyle = () => '';
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
</script>

<section class="card calendar-card">
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
    <label class="calendar-date-picker">
      Semaine cible
      <select value={selectedDutyWeekId} on:change={(event) => selectDutyWeek(event.currentTarget.value)}>
        <option value="">Choisir...</option>
        {#each dutyWeeks as week}
          <option value={week.id}>{formatDutyWeekLabel(week)}</option>
        {/each}
      </select>
    </label>
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
            <GradeBadge grade={header.member.grade} {getGradeAcronym} {getGradeBadgeTone} />
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
