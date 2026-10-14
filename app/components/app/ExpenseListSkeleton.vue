<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })
</script>

<template>
  <ul aria-hidden="true">
    <li v-for="i in rows" :key="i" class="flex min-h-14 items-center gap-3 border-b border-line py-2">
      <div class="flex-1 space-y-2">
        <Skeleton class="h-4 w-2/5" />
        <Skeleton class="h-3 w-1/4" />
      </div>
      <Skeleton class="h-4 w-16" />
    </li>
  </ul>
</template>
