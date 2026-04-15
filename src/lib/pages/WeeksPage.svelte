<script>
  export let dutyWeeks = [];
  export let dutyWeek = { id: '', start: '', end: '' };
  export let selectedDutyWeekId = '';
  export let formatDutyWeekLabel = () => '';
  export let onSelectWeek = () => {};
  export let onStartNewWeek = () => {};
  export let onGoEditWeek = () => {};
  export let onDutyWeekFieldChange = () => {};
  export let onSetDutyWeek = () => {};
</script>

<section class="card">
  <h2>Semaines de piquet</h2>
  <div class="row">
    <label>
      Semaine cible (édition)
      <select value={selectedDutyWeekId} on:change={(event) => onSelectWeek(event.currentTarget.value)}>
        <option value="">Choisir...</option>
        {#each dutyWeeks as week}
          <option value={week.id}>{formatDutyWeekLabel(week)}</option>
        {/each}
      </select>
    </label>
    <button on:click={onStartNewWeek}>Nouvelle semaine</button>
    <button on:click={onGoEditWeek} disabled={!selectedDutyWeekId}>Modifier / Supprimer</button>
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
    <button on:click={onSetDutyWeek}>{selectedDutyWeekId ? 'Mettre à jour la semaine active' : 'Ajouter la semaine'}</button>
  </div>
  <small>Format recommandé: vendredi 18:00 → lundi suivant 06:00. Toute semaine ajoutée est automatiquement active.</small>
  {#if dutyWeeks.length > 0}
    <div class="list">
      {#each dutyWeeks as week}
        <article>
          <span class="inline-flex items-center gap-2">
            <span class="role-badge">Active</span>
            <strong>{formatDutyWeekLabel(week)}</strong>
            {#if week.id === selectedDutyWeekId}
              <span class="role-badge">Cible</span>
            {/if}
          </span>
          <button on:click={() => onSelectWeek(week.id)}>Sélectionner</button>
        </article>
      {/each}
    </div>
  {/if}
</section>
