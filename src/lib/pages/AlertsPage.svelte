<script>
  import GradeBadge from '../components/common/GradeBadge.svelte';
  import RoleBadge from '../components/common/RoleBadge.svelte';

  export let constraintAlerts = [];
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
  export let getRoleBadgeText = (code) => code;
</script>

<section class="card">
  <h2>Alertes de contraintes</h2>
  {#if constraintAlerts.length === 0}
    <p class="ok">Toutes les contraintes sont respectées pour les créneaux définis.</p>
  {:else}
    <div class="alerts">
      {#each constraintAlerts as alert}
        <article class={`alert-card ${alert.severity}`}>
          <strong>{alert.slotLabel}</strong> ({alert.period}) - disponibles: {alert.total}<br />
          <span>{alert.severity === 'warning' ? 'Warning' : 'Alerte critique'}</span><br />
          <span class="inline-flex flex-wrap items-center gap-2">
            Présence par rôle:
            {#each alert.rolePresenceItems as roleItem}
              <span class="role-badge">{roleItem.label} {roleItem.available}/{roleItem.expected}</span>
            {/each}
          </span><br />
          <span>Rôles manquants: {alert.detail}</span><br />
          {#if alert.conflictAbsences.length > 0}
            {#each alert.conflictAbsences as conflict}
              <span class="inline-flex items-center gap-2">
                Conflit absence:
                {#if conflict.member}
                  <GradeBadge grade={conflict.member.grade} {getGradeAcronym} {getGradeBadgeTone} />
                  <span>{conflict.member.prenom} {conflict.member.nom}</span>
                {:else}
                  <span>Inconnu</span>
                {/if}
                <span>({conflict.startLabel} - {conflict.endLabel})</span>
              </span><br />
            {/each}
          {/if}
          {#if alert.missingCandidates.length > 0}
            {#each alert.missingCandidates as candidate}
              <span>
                Absents pouvant couvrir <RoleBadge role={candidate.role} {getRoleBadgeText} />:
                {#if candidate.members.length > 0}
                  {#each candidate.members as person, idx}
                    <GradeBadge grade={person.grade} {getGradeAcronym} {getGradeBadgeTone} />
                    <span>{person.prenom} {person.nom}</span>{#if idx < candidate.members.length - 1}, {/if}
                  {/each}
                {:else}
                  aucun
                {/if}
              </span><br />
            {/each}
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>
