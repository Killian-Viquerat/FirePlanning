<script>
  export let selectedIndividualFirefighterId = '';
  export let groupMembers = [];
  export let onSelectIndividualFirefighter = () => {};
  export let selectedDutyWeekId = '';
  export let dutyWeeks = [];
  export let selectDutyWeek = () => {};
  export let formatDutyWeekLabel = () => '';
  export let moveIndividualCalendar = () => {};
  export let individualDayPicker = '';
  export let setIndividualCalendarDate = () => {};
  export let individualCalendarRangeLabel = '';
  export let CALENDAR_ROW_HEIGHT = 32;
  export let SLOTS_PER_DAY = 48;
  export let HALF_HOUR_SLOTS = [];
  export let formatHourLabel = (slot) => String(slot);
  export let formatRangeDate = (value) => value;
  export let individualRange = { start: new Date(), end: new Date() };
  export let isIndividualSlotSelected = () => false;
  export let beginIndividualSelection = () => {};
  export let extendIndividualSelection = () => {};
  export let handleIndividualSlotClick = () => {};
  export let individualCalendarSegments = [];
  export let getIndividualSegmentStyle = () => '';
  export let removeAbsence = () => {};
  export let getGradeAcronym = (value) => value;
  export let onColumnRef = () => {};
  let calendarColumnEl;

  $: onColumnRef(calendarColumnEl);
</script>

<section class="card calendar-card">
  <div class="calendar-head">
    <h2>Calendrier individuel (édition des absences)</h2>
    <span class="calendar-badge">Édition active</span>
  </div>
  <div class="row">
    <label>
      Ajouter une absence (clic-glisser) pour
      <select value={selectedIndividualFirefighterId} on:change={(event) => onSelectIndividualFirefighter(event.currentTarget.value)}>
        <option value="">Choisir un pompier...</option>
        {#each groupMembers as member}
          <option value={member.id}>[{getGradeAcronym(member.grade)}] {member.prenom} {member.nom}</option>
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
      Semaine cible
      <select value={selectedDutyWeekId} on:change={(event) => selectDutyWeek(event.currentTarget.value)}>
        <option value="">Choisir...</option>
        {#each dutyWeeks as week}
          <option value={week.id}>{formatDutyWeekLabel(week)}</option>
        {/each}
      </select>
    </label>
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

      <div class="calendar-day-column" bind:this={calendarColumnEl}>
        {#each HALF_HOUR_SLOTS as slot}
          <button
            type="button"
            class="calendar-slot-line selectable"
            class:selected={isIndividualSlotSelected(slot)}
            aria-label={`Créer une absence à partir de ${formatHourLabel(slot)}`}
            on:pointerdown={(event) => beginIndividualSelection(slot, event)}
            on:pointerenter={() => extendIndividualSelection(slot)}
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
