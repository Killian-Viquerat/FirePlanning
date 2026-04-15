<script>
  export let onExportJson = () => {};
  export let onImportJson = () => {};
  let importInput;
</script>

<section class="card">
  <h2>Import / Export JSON</h2>
  <div class="row">
    <button on:click={onExportJson}>Exporter JSON</button>
    <button on:click={() => importInput?.click()}>Importer JSON</button>
    <input bind:this={importInput} type="file" accept="application/json" hidden on:change={onImportJson} />
  </div>
</section>
