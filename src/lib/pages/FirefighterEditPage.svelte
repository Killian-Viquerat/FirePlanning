<script>
  import RoleBadge from '../components/common/RoleBadge.svelte';

  export let firefighters = [];
  export let selectedEditFirefighterId = '';
  export let firefighterEditForm = { nom: '', prenom: '', grade: '', fonctions: [] };
  export let functions = [];
  export let gradeOptions = [];
  export let getRoleBadgeText = (code) => code;
  export let getGradeAcronym = (value) => value;
  export let isKnownGrade = () => true;
  export let onBack = () => {};
  export let onSelectedFirefighterChange = () => {};
  export let onFieldChange = () => {};
  export let onToggleFunction = () => {};
  export let onUpdateFirefighter = () => {};
  export let onDeleteFirefighter = () => {};
</script>

<section class="card">
  <h2>Modifier / Supprimer pompier</h2>
  <div class="row">
    <button on:click={onBack}>Retour pompiers</button>
  </div>
  {#if firefighters.length === 0}
    <p>Aucun pompier à modifier.</p>
  {:else}
    <div class="row">
      <label>
        Pompier
        <select value={selectedEditFirefighterId} on:change={(event) => onSelectedFirefighterChange(event.currentTarget.value)}>
          {#each firefighters as firefighter}
            <option value={firefighter.id}>[{getGradeAcronym(firefighter.grade)}] {firefighter.prenom} {firefighter.nom}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="grid">
      <label>
        Nom
        <input type="text" value={firefighterEditForm.nom} on:input={(event) => onFieldChange('nom', event.currentTarget.value)} />
      </label>
      <label>
        Prénom
        <input
          type="text"
          value={firefighterEditForm.prenom}
          on:input={(event) => onFieldChange('prenom', event.currentTarget.value)}
        />
      </label>
      <label>
        Grade
        <select value={firefighterEditForm.grade} on:change={(event) => onFieldChange('grade', event.currentTarget.value)}>
          {#if firefighterEditForm.grade && !isKnownGrade(firefighterEditForm.grade)}
            <option value={firefighterEditForm.grade}>{firefighterEditForm.grade}</option>
          {/if}
          <option value="">Choisir un grade...</option>
          {#each gradeOptions as option}
            <option value={option.value}>{option.value} ({option.acronym})</option>
          {/each}
        </select>
      </label>
    </div>

    <p>Fonctions:</p>
    <div class="checks">
      {#each functions as fonction}
        <label class="check">
          <input
            type="checkbox"
            checked={firefighterEditForm.fonctions.includes(fonction)}
            on:change={() => onToggleFunction(fonction)}
          />
          <RoleBadge role={fonction} {getRoleBadgeText} />
        </label>
      {/each}
    </div>

    <div class="row">
      <button on:click={onUpdateFirefighter}>Mettre à jour</button>
      <button class="button-danger" on:click={onDeleteFirefighter}>Supprimer pompier</button>
    </div>
  {/if}
</section>
