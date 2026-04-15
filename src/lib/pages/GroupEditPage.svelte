<script>
  export let group = null;
  export let groupEditNumber = '';
  export let onGroupEditNumberChange = () => {};
  export let onBack = () => {};
  export let onUpdateGroup = () => {};
  export let onDeleteGroup = () => {};
</script>

<section class="card">
  <h2>Modifier / Supprimer groupe</h2>
  <div class="row">
    <button on:click={onBack}>Retour groupe</button>
  </div>
  {#if !group}
    <p>Aucun groupe actif à modifier.</p>
  {:else}
    <div class="row">
      <label>
        Numéro de groupe
        <input
          type="text"
          value={groupEditNumber}
          placeholder="Ex: 1"
          on:input={(event) => onGroupEditNumberChange(event.currentTarget.value)}
        />
      </label>
      <button on:click={onUpdateGroup}>Mettre à jour</button>
      <button class="button-danger" on:click={onDeleteGroup}>Supprimer groupe</button>
    </div>
    <small>Code actuel: {group.code}</small>
  {/if}
</section>
