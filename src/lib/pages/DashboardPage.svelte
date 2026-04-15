<script>
  import GradeBadge from '../components/common/GradeBadge.svelte';

  export let dashboardStats = {
    groupCode: 'Aucun groupe',
    firefightersTotal: 0,
    membersTotal: 0,
    weeksTotal: 0,
    slotsTotal: 0,
    absencesTotal: 0,
    criticalAlerts: 0,
    warningAlerts: 0
  };
  export let activeDutyWeekIds = [];
  export let roleCoverageSummary = [];
  export let absencesByFirefighter = [];
  export let getRoleBadgeText = (code) => code;
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
</script>

<section class="card">
  <h2>Dashboard</h2>
  <div class="dashboard-grid">
    <article class="dashboard-tile"><strong>Groupe</strong><span>{dashboardStats.groupCode}</span></article>
    <article class="dashboard-tile"><strong>Pompiers</strong><span>{dashboardStats.firefightersTotal}</span></article>
    <article class="dashboard-tile"><strong>Membres de groupe</strong><span>{dashboardStats.membersTotal}</span></article>
    <article class="dashboard-tile"><strong>Semaines planifiées</strong><span>{dashboardStats.weeksTotal}</span></article>
    <article class="dashboard-tile"><strong>Semaines actives</strong><span>{activeDutyWeekIds.length}</span></article>
    <article class="dashboard-tile"><strong>Créneaux</strong><span>{dashboardStats.slotsTotal}</span></article>
    <article class="dashboard-tile"><strong>Absences (semaines actives)</strong><span>{dashboardStats.absencesTotal}</span></article>
    <article class="dashboard-tile"><strong>Alertes critiques</strong><span>{dashboardStats.criticalAlerts}</span></article>
    <article class="dashboard-tile"><strong>Warnings</strong><span>{dashboardStats.warningAlerts}</span></article>
  </div>

  <h2>Couverture des rôles (membres de groupe)</h2>
  <div class="checks">
    {#each roleCoverageSummary as roleItem}
      <span class="role-badge">{getRoleBadgeText(roleItem.role)}: {roleItem.count}</span>
    {/each}
  </div>

  <h2>Absences par pompier</h2>
  {#if absencesByFirefighter.length === 0}
    <p>Aucune absence enregistrée.</p>
  {:else}
    <div class="list">
      {#each absencesByFirefighter as item}
        <article>
          <span class="inline-flex items-center gap-2">
            <GradeBadge grade={item.member.grade} {getGradeAcronym} {getGradeBadgeTone} />
            <strong>{item.member.prenom} {item.member.nom}</strong>
          </span>
          <span>{item.count} absence(s)</span>
        </article>
      {/each}
    </div>
  {/if}
</section>
