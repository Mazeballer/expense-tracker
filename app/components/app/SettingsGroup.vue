<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section :aria-label="title">
    <h2 v-if="title" class="t-secondary px-4 pb-2 text-muted-foreground">{{ title }}</h2>
    <ul class="overflow-hidden rounded-2xl border border-line bg-surface">
      <slot />
    </ul>
  </section>
</template>
