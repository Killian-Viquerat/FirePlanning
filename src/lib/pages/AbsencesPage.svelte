<script>
  import GradeBadge from '../components/common/GradeBadge.svelte';

  export let dutyWeeks = [];
  export let selectedDutyWeekId = '';
  export let absenceForm = { firefighterId: '', start: '', end: '' };
  export let groupMembers = [];
  export let activeDutyWeekIds = [];
  export let activeWeekAbsences = [];
  export let firefighters = [];
  export let formatDutyWeekLabel = () => '';
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
  export let onSelectWeek = () => {};
  export let onAbsenceFieldChange = () => {};
  export let onAddAbsence = () => {};
  export let onRemoveAbsence = () => {};
</script>

<section class="card">
  <h2>Absences</h2>
  <div class="row">
    <label>
      Semaine cible (ajout)
      <select value={selectedDutyWeekId} on:change={(event) => onSelectWeek(event.currentTarget.value)}>
        <option value="">Choisir...</option>
        {#each dutyWeeks as week}
          <option value={week.id}>{formatDutyWeekLabel(week)}</option>
        {/each}
      </select>
    </label>
    <label>
      Sapeur
      <select value={absenceForm.firefighterId} on:change={(event) => onAbsenceFieldChange('firefighterId', event.currentTarget.value)}>
        <option value="">Choisir...</option>
        {#each groupMembers as member}
          <option value={member.id}>[{getGradeAcronym(member.grade)}] {member.prenom} {member.nom}</option>
        {/each}
      </select>
    </label>
    <label>
      Début
      <input type="datetime-local" value={absenceForm.start} on:input={(event) => onAbsenceFieldChange('start', event.currentTarget.value)} />
    </label>
    <label>
      Fin
      <input type="datetime-local" value={absenceForm.end} on:input={(event) => onAbsenceFieldChange('end', event.currentTarget.value)} />
    </label>
    <button on:click={onAddAbsence} disabled={!selectedDutyWeekId}>Ajouter absence</button>
  </div>
  <small>Semaines actives: {activeDutyWeekIds.length}. Les absences listées ci-dessous correspondent aux semaines actives.</small>
  {#if !selectedDutyWeekId}
    <small>Sélectionnez d'abord une semaine cible pour ajouter des absences.</small>
  {/if}
  <div class="list">
    {#if activeWeekAbsences.length === 0}
      <p>Aucune absence pour la semaine active.</p>
    {:else}
      {#each activeWeekAbsences as absence}
        {@const member = firefighters.find((f) => f.id === absence.firefighterId)}
        <article>
          <span class="inline-flex items-center gap-2">
            <GradeBadge grade={member?.grade ?? ''} {getGradeAcronym} {getGradeBadgeTone} />
            <span>{member?.prenom} {member?.nom}: {new Date(absence.start).toLocaleString('fr-CH')} - {new Date(absence.end).toLocaleString('fr-CH')}</span>
          </span>
          <button on:click={() => onRemoveAbsence(absence.id)}>Supprimer</button>
        </article>
      {/each}
    {/if}
  </div>
</section>
