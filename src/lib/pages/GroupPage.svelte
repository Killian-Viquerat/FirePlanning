<script>
  export let groupNumber = '';
  export let group = null;
  export let onGroupNumberChange = () => {};
  export let onCreateGroup = () => {};
  export let onEditGroup = () => {};
</script>

<section class="card">
  <h2>Groupe de piquet</h2>
  <div class="row">
    <label>
      Numéro de groupe
      <input
        type="text"
        value={groupNumber}
        placeholder="Ex: 1"
        on:input={(event) => onGroupNumberChange(event.currentTarget.value)}
      />
    </label>
    <button on:click={onCreateGroup}>Créer le groupe</button>
    {#if group}
      <button on:click={onEditGroup}>Modifier ce groupe</button>
    {/if}
  </div>
  {#if group}
    <p class="ok">Groupe actif: <strong>{group.code}</strong></p>
  {/if}
</section>
