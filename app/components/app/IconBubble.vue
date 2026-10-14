<script setup lang="ts">
defineProps<{ icon: string }>()
</script>

<template>
  <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xl" aria-hidden="true">{{ icon }}</span>
</template>
