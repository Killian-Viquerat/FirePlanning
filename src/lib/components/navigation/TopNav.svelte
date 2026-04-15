<script>
  import { createEventDispatcher } from 'svelte';

  export let activePage = 'dashboard';
  export let isDarkTheme = false;

  const dispatch = createEventDispatcher();

  const pages = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'groupe', label: 'Groupe' },
    { key: 'pompiers', label: 'Pompiers' },
    { key: 'semaine', label: 'Semaine' },
    { key: 'absences', label: 'Absences' },
    { key: 'alertes', label: 'Alertes' },
    { key: 'donnees', label: 'Import/Export' },
    { key: 'calendrier-global', label: 'Calendrier global' },
    { key: 'calendrier-individuel', label: 'Calendrier individuel' }
  ];
</script>

<nav class="top-nav">
  {#each pages as page}
    <button
      class:active={activePage === page.key}
      on:click={() => dispatch('navigate', { page: page.key })}
    >
      {page.label}
    </button>
  {/each}
  <button class="theme-toggle" on:click={() => dispatch('toggle-theme')}>
    {isDarkTheme ? 'White theme' : 'Black theme'}
  </button>
</nav>
