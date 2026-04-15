<script>
  import DashboardPage from '../../pages/DashboardPage.svelte';
  import GroupPage from '../../pages/GroupPage.svelte';
  import GroupEditPage from '../../pages/GroupEditPage.svelte';
  import FirefightersPage from '../../pages/FirefightersPage.svelte';
  import FirefighterEditPage from '../../pages/FirefighterEditPage.svelte';
  import WeeksPage from '../../pages/WeeksPage.svelte';
  import WeekEditPage from '../../pages/WeekEditPage.svelte';
  import AbsencesPage from '../../pages/AbsencesPage.svelte';
  import AlertsPage from '../../pages/AlertsPage.svelte';
  import DataPage from '../../pages/DataPage.svelte';
  import GlobalCalendarPage from '../../pages/GlobalCalendarPage.svelte';
  import IndividualCalendarPage from '../../pages/IndividualCalendarPage.svelte';

  export let page = 'dashboard';
  export let viewModel;
</script>

{#if page === 'dashboard'}
  <DashboardPage
    dashboardStats={$viewModel.dashboardStats}
    activeDutyWeekIds={$viewModel.activeDutyWeekIds}
    roleCoverageSummary={$viewModel.roleCoverageSummary}
    absencesByFirefighter={$viewModel.absencesByFirefighter}
    getRoleBadgeText={$viewModel.getRoleBadgeText}
    getGradeAcronym={$viewModel.getGradeAcronym}
    getGradeBadgeTone={$viewModel.getGradeBadgeTone}
  />
{:else if page === 'groupe'}
  <GroupPage
    groupNumber={$viewModel.groupNumber}
    group={$viewModel.group}
    onGroupNumberChange={$viewModel.updateGroupNumber}
    onCreateGroup={$viewModel.createGroup}
    onEditGroup={() => $viewModel.setActivePage('groupe-modifier')}
  />
{:else if page === 'groupe-modifier'}
  <GroupEditPage
    group={$viewModel.group}
    groupEditNumber={$viewModel.groupEditNumber}
    onGroupEditNumberChange={$viewModel.updateGroupEditNumber}
    onBack={() => $viewModel.setActivePage('groupe')}
    onUpdateGroup={$viewModel.updateGroup}
    onDeleteGroup={$viewModel.deleteGroup}
  />
{:else if page === 'pompiers'}
  <FirefightersPage
    firefighterForm={$viewModel.firefighterForm}
    firefighters={$viewModel.firefighters}
    group={$viewModel.group}
    groupMemberIds={$viewModel.groupMemberIds}
    functions={$viewModel.FUNCTIONS}
    gradeOptions={$viewModel.GRADE_OPTIONS}
    getRoleBadgeText={$viewModel.getRoleBadgeText}
    getGradeAcronym={$viewModel.getGradeAcronym}
    getGradeBadgeTone={$viewModel.getGradeBadgeTone}
    onFieldChange={$viewModel.updateFirefighterFormField}
    onToggleFunction={$viewModel.toggleFunction}
    onAddFirefighter={$viewModel.addFirefighter}
    onGroupAssignmentChange={$viewModel.updateGroupAssignment}
    onOpenFirefighterEditor={$viewModel.openFirefighterEditor}
  />
{:else if page === 'pompiers-modifier'}
  <FirefighterEditPage
    firefighters={$viewModel.firefighters}
    selectedEditFirefighterId={$viewModel.selectedEditFirefighterId}
    firefighterEditForm={$viewModel.firefighterEditForm}
    functions={$viewModel.FUNCTIONS}
    gradeOptions={$viewModel.GRADE_OPTIONS}
    getRoleBadgeText={$viewModel.getRoleBadgeText}
    getGradeAcronym={$viewModel.getGradeAcronym}
    isKnownGrade={$viewModel.isKnownGrade}
    onBack={() => $viewModel.setActivePage('pompiers')}
    onSelectedFirefighterChange={$viewModel.setSelectedEditFirefighter}
    onFieldChange={$viewModel.updateFirefighterEditFormField}
    onToggleFunction={$viewModel.toggleEditFunction}
    onUpdateFirefighter={$viewModel.updateFirefighter}
    onDeleteFirefighter={$viewModel.deleteFirefighter}
  />
{:else if page === 'semaine'}
  <WeeksPage
    dutyWeeks={$viewModel.dutyWeeks}
    dutyWeek={$viewModel.dutyWeek}
    selectedDutyWeekId={$viewModel.selectedDutyWeekId}
    formatDutyWeekLabel={$viewModel.formatDutyWeekLabel}
    onSelectWeek={$viewModel.selectDutyWeek}
    onStartNewWeek={$viewModel.startNewDutyWeek}
    onGoEditWeek={() => $viewModel.setActivePage('semaine-modifier')}
    onDutyWeekFieldChange={$viewModel.updateDutyWeekField}
    onSetDutyWeek={$viewModel.setDutyWeek}
  />
{:else if page === 'semaine-modifier'}
  <WeekEditPage
    dutyWeeks={$viewModel.dutyWeeks}
    dutyWeek={$viewModel.dutyWeek}
    selectedDutyWeekId={$viewModel.selectedDutyWeekId}
    formatDutyWeekLabel={$viewModel.formatDutyWeekLabel}
    onBack={() => $viewModel.setActivePage('semaine')}
    onSelectWeek={$viewModel.selectDutyWeek}
    onDutyWeekFieldChange={$viewModel.updateDutyWeekField}
    onSetDutyWeek={$viewModel.setDutyWeek}
    onDeleteDutyWeek={$viewModel.deleteDutyWeek}
  />
{:else if page === 'absences'}
  <AbsencesPage
    dutyWeeks={$viewModel.dutyWeeks}
    selectedDutyWeekId={$viewModel.selectedDutyWeekId}
    absenceForm={$viewModel.absenceForm}
    groupMembers={$viewModel.groupMembers}
    activeDutyWeekIds={$viewModel.activeDutyWeekIds}
    activeWeekAbsences={$viewModel.activeWeekAbsences}
    firefighters={$viewModel.firefighters}
    formatDutyWeekLabel={$viewModel.formatDutyWeekLabel}
    getGradeAcronym={$viewModel.getGradeAcronym}
    getGradeBadgeTone={$viewModel.getGradeBadgeTone}
    onSelectWeek={$viewModel.selectDutyWeek}
    onAbsenceFieldChange={$viewModel.updateAbsenceField}
    onAddAbsence={$viewModel.addAbsence}
    onRemoveAbsence={$viewModel.removeAbsence}
  />
{:else if page === 'alertes'}
  <AlertsPage
    constraintAlerts={$viewModel.constraintAlerts}
    getGradeAcronym={$viewModel.getGradeAcronym}
    getGradeBadgeTone={$viewModel.getGradeBadgeTone}
    getRoleBadgeText={$viewModel.getRoleBadgeText}
  />
{:else if page === 'donnees'}
  <DataPage onExportJson={$viewModel.exportJson} onImportJson={$viewModel.importJson} />
{:else if page === 'calendrier-global'}
  <GlobalCalendarPage
    moveGlobalCalendar={$viewModel.moveGlobalCalendar}
    selectedDutyWeekId={$viewModel.selectedDutyWeekId}
    dutyWeeks={$viewModel.dutyWeeks}
    selectDutyWeek={$viewModel.selectDutyWeek}
    formatDutyWeekLabel={$viewModel.formatDutyWeekLabel}
    globalCalendarView={$viewModel.globalCalendarView}
    setGlobalCalendarView={$viewModel.setGlobalCalendarView}
    globalDayPicker={$viewModel.globalDayPicker}
    setGlobalCalendarDate={$viewModel.setGlobalCalendarDate}
    globalCalendarRangeLabel={$viewModel.globalCalendarRangeLabel}
    globalColumnHeaders={$viewModel.globalColumnHeaders}
    CALENDAR_ROW_HEIGHT={$viewModel.CALENDAR_ROW_HEIGHT}
    SLOTS_PER_DAY={$viewModel.SLOTS_PER_DAY}
    HALF_HOUR_SLOTS={$viewModel.HALF_HOUR_SLOTS}
    formatHourLabel={$viewModel.formatHourLabel}
    globalColumnSegments={$viewModel.globalColumnSegments}
    getGlobalSegmentStyle={$viewModel.getGlobalSegmentStyle}
    getGradeAcronym={$viewModel.getGradeAcronym}
    getGradeBadgeTone={$viewModel.getGradeBadgeTone}
  />
{:else if page === 'calendrier-individuel'}
  <IndividualCalendarPage
    selectedIndividualFirefighterId={$viewModel.selectedIndividualFirefighterId}
    groupMembers={$viewModel.groupMembers}
    onSelectIndividualFirefighter={$viewModel.setSelectedIndividualFirefighter}
    selectedDutyWeekId={$viewModel.selectedDutyWeekId}
    dutyWeeks={$viewModel.dutyWeeks}
    selectDutyWeek={$viewModel.selectDutyWeek}
    formatDutyWeekLabel={$viewModel.formatDutyWeekLabel}
    moveIndividualCalendar={$viewModel.moveIndividualCalendar}
    individualDayPicker={$viewModel.individualDayPicker}
    setIndividualCalendarDate={$viewModel.setIndividualCalendarDate}
    individualCalendarRangeLabel={$viewModel.individualCalendarRangeLabel}
    CALENDAR_ROW_HEIGHT={$viewModel.CALENDAR_ROW_HEIGHT}
    SLOTS_PER_DAY={$viewModel.SLOTS_PER_DAY}
    HALF_HOUR_SLOTS={$viewModel.HALF_HOUR_SLOTS}
    formatHourLabel={$viewModel.formatHourLabel}
    formatRangeDate={$viewModel.formatRangeDate}
    individualRange={$viewModel.individualRange}
    isIndividualSlotSelected={$viewModel.isIndividualSlotSelected}
    beginIndividualSelection={$viewModel.beginIndividualSelection}
    extendIndividualSelection={$viewModel.extendIndividualSelection}
    handleIndividualSlotClick={$viewModel.handleIndividualSlotClick}
    individualCalendarSegments={$viewModel.individualCalendarSegments}
    getIndividualSegmentStyle={$viewModel.getIndividualSegmentStyle}
    removeAbsence={$viewModel.removeAbsence}
    getGradeAcronym={$viewModel.getGradeAcronym}
    onColumnRef={$viewModel.setIndividualCalendarColumnRef}
  />
{/if}
