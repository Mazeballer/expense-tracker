<script setup lang="ts">
const online = useOnline()
</script>

<template>
  <div v-if="!online" role="status" class="border-b border-line bg-surface px-4 py-3 t-secondary text-ink lg:ml-60 lg:px-8">
    You're offline. You can look at your saved data, but you can't add or change expenses until you reconnect.
  </div>
</template>
