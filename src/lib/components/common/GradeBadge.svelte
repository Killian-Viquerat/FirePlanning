<script>
  export let grade = '';
  export let getGradeAcronym = (value) => value;
  export let getGradeBadgeTone = () => '';
</script>

<span class={`grade-badge ${getGradeBadgeTone(grade)}`}>{getGradeAcronym(grade)}</span>
