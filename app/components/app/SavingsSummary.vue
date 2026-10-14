<script setup lang="ts">
import { formatMoney, formatPercent } from '~/lib/format'

defineProps<{ total: number; goal: number | null; progress: number | null }>()
</script>

<template>
  <section aria-label="Savings and investments" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4">
      <h2 class="t-heading">Savings and investments</h2>
      <NuxtLink to="/savings" class="flex min-h-11 items-center text-brand-text">See savings</NuxtLink>
    </div>
    <div class="flex items-baseline justify-between border-y border-line py-3">
      <span class="text-muted-foreground">Total saved</span>
      <span class="font-medium">{{ formatMoney(total) }}</span>
    </div>
    <template v-if="goal && progress !== null">
      <div class="h-1 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Progress to savings goal" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-brand" :style="{ width: `${progress * 100}%` }" />
      </div>
      <p class="t-secondary text-muted-foreground">{{ formatPercent(progress) }} of {{ formatMoney(goal) }}</p>
    </template>
  </section>
</template>
