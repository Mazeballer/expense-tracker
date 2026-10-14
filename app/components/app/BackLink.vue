<script setup lang="ts">
import { PhCaretLeft } from '@phosphor-icons/vue'

defineProps<{ to: string; label: string }>()
</script>

<template>
  <NuxtLink :to="to" class="-ml-2 flex min-h-11 w-fit items-center gap-1 pr-3 text-brand-text">
    <PhCaretLeft :size="20" weight="bold" />
    {{ label }}
  </NuxtLink>
</template>
