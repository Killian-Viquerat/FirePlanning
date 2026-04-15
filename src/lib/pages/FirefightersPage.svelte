<script>
  import GradeBadge from '../components/common/GradeBadge.svelte';
  import RoleBadge from '../components/common/RoleBadge.svelte';

  export let firefighterForm = { nom: '', prenom: '', grade: '', fonctions: [] };
  export let firefighters = [];
  export let group = null;
  export let groupMemberIds = [];
  export let functions = [];
  export let gradeOptions = [];
  export let getRoleBadgeText = (code) => code;
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
  export let onFieldChange = () => {};
  export let onToggleFunction = () => {};
  export let onAddFirefighter = () => {};
  export let onGroupAssignmentChange = () => {};
  export let onOpenFirefighterEditor = () => {};
</script>

<section class="card">
  <h2>Sapeurs pompiers</h2>
  <div class="grid">
    <label>
      Nom
      <input type="text" value={firefighterForm.nom} on:input={(event) => onFieldChange('nom', event.currentTarget.value)} />
    </label>
    <label>
      Prénom
      <input
        type="text"
        value={firefighterForm.prenom}
        on:input={(event) => onFieldChange('prenom', event.currentTarget.value)}
      />
    </label>
    <label>
      Grade
      <select value={firefighterForm.grade} on:change={(event) => onFieldChange('grade', event.currentTarget.value)}>
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
          checked={firefighterForm.fonctions.includes(fonction)}
          on:change={() => onToggleFunction(fonction)}
        />
        <RoleBadge role={fonction} {getRoleBadgeText} />
      </label>
    {/each}
  </div>
  <button on:click={onAddFirefighter}>Ajouter le pompier</button>

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
            on:change={(event) => onGroupAssignmentChange(firefighter.id, event.currentTarget.checked)}
          />
          <GradeBadge grade={firefighter.grade} {getGradeAcronym} {getGradeBadgeTone} />
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
        <button class="list-link" on:click={() => onOpenFirefighterEditor(firefighter.id)}>
          <span class="inline-flex items-center gap-2">
            <GradeBadge grade={firefighter.grade} {getGradeAcronym} {getGradeBadgeTone} />
            <strong>{firefighter.prenom} {firefighter.nom}</strong>
          </span>
          <span class="ml-2 inline-flex flex-wrap gap-1 align-middle">
            {#each firefighter.fonctions as roleCode}
              <RoleBadge role={roleCode} {getRoleBadgeText} />
            {/each}
          </span>
        </button>
      {/each}
    {/if}
  </div>
</section>
