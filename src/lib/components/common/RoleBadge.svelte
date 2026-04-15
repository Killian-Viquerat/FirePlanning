<script>
  export let role = '';
  export let getRoleBadgeText = (code) => code;
</script>

<span class="role-badge">{getRoleBadgeText(role)}</span>
