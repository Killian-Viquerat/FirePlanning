<script>
  export let dutyWeeks = [];
  export let dutyWeek = { id: '', start: '', end: '' };
  export let selectedDutyWeekId = '';
  export let formatDutyWeekLabel = () => '';
  export let onBack = () => {};
  export let onSelectWeek = () => {};
  export let onDutyWeekFieldChange = () => {};
  export let onSetDutyWeek = () => {};
  export let onDeleteDutyWeek = () => {};
</script>

<section class="card">
  <h2>Modifier / Supprimer une semaine</h2>
  <div class="row">
    <button on:click={onBack}>Retour semaine</button>
  </div>
  {#if dutyWeeks.length === 0}
    <p>Aucune semaine à modifier.</p>
  {:else}
    <div class="row">
      <label>
        Semaine cible (édition)
        <select value={selectedDutyWeekId} on:change={(event) => onSelectWeek(event.currentTarget.value)}>
          {#each dutyWeeks as week}
            <option value={week.id}>{formatDutyWeekLabel(week)}</option>
          {/each}
        </select>
      </label>
      <span class="role-badge">Toutes les semaines sont actives</span>
    </div>
    <div class="row">
      <label>
        Début
        <input type="datetime-local" value={dutyWeek.start} on:input={(event) => onDutyWeekFieldChange('start', event.currentTarget.value)} />
      </label>
      <label>
        Fin
        <input type="datetime-local" value={dutyWeek.end} on:input={(event) => onDutyWeekFieldChange('end', event.currentTarget.value)} />
      </label>
      <button on:click={onSetDutyWeek}>Mettre à jour</button>
      <button class="button-danger" on:click={onDeleteDutyWeek}>Supprimer semaine</button>
    </div>
    <small>La suppression d'une semaine retire les absences rattachées à cette semaine.</small>
  {/if}
</section>
