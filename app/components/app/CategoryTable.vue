<script setup lang="ts">
import { formatMoney, formatPercent } from '~/lib/format'

export type CategoryRow = { id: string; name: string; total: number; share: number; change: number | null; colorVar: string }
defineProps<{ rows: CategoryRow[] }>()

function changeLabel(change: number | null) {
  if (change === null) return 'New'
  if (change === 0) return 'No change'
  return `${change > 0 ? '+' : '-'}${formatMoney(Math.abs(change))}`
}
</script>

<template>
  <div class="w-full">
    <div class="hidden grid-cols-[1fr_96px_64px_112px] gap-3 border-b border-line pb-2 t-caption text-muted-foreground lg:grid">
      <span>Category</span><span class="text-right">Amount</span><span class="text-right">Share</span><span class="text-right">vs last month</span>
    </div>
    <ul>
      <li v-for="r in rows" :key="r.id" class="grid min-h-12 grid-cols-[1fr_auto_48px] items-center gap-3 border-b border-line last:border-b-0 lg:grid-cols-[1fr_96px_64px_112px]">
        <span class="flex min-w-0 items-center gap-3">
          <span class="size-2 shrink-0 rounded-[2px]" :style="{ backgroundColor: r.colorVar }" aria-hidden="true" />
          <span class="truncate">{{ r.name }}</span>
        </span>
        <span class="text-right font-medium">{{ formatMoney(r.total) }}</span>
        <span class="text-right text-muted-foreground">{{ formatPercent(r.share) }}</span>
        <span class="hidden text-right text-muted-foreground lg:block">{{ changeLabel(r.change) }}</span>
      </li>
    </ul>
  </div>
</template>
