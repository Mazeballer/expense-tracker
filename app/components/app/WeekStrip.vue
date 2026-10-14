<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { BudgetStatus, Period } from '~/lib/budget'

export type WeekBar = { progress: number; status: BudgetStatus | null; started: boolean }

defineProps<{ weeks: Period[]; bars: WeekBar[]; selected: number; current: number }>()
defineEmits<{ select: [index: number] }>()

const dayRange = (w: Period) => `${Number(w.from.slice(8))}-${Number(w.to.slice(8))}`
const fill = (b: WeekBar) => (b.status === 'reached' ? 'bg-alert' : b.status === 'near' ? 'bg-warn' : 'bg-brand')
</script>

<template>
  <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }" role="radiogroup" aria-label="Week">
    <button
      v-for="(w, i) in weeks"
      :key="w.key"
      type="button"
      role="radio"
      :aria-checked="selected === i"
      :aria-label="`${w.label}, days ${dayRange(w)}${current === i ? ', this week' : ''}`"
      :class="cn('flex flex-col items-center gap-2 rounded-3xl px-1 pb-2 pt-3 transition-colors', selected === i ? 'bg-brand/10' : '')"
      @click="$emit('select', i)"
    >
      <span class="relative flex h-24 w-9 items-end overflow-hidden rounded-full" :class="bars[i]?.started ? 'bg-line' : 'bg-line/50'">
        <span
          v-if="bars[i]?.started"
          class="w-full rounded-full transition-[height] duration-500 ease-out"
          :class="fill(bars[i]!)"
          :style="{ height: `${Math.max(bars[i]!.progress * 100, bars[i]!.progress > 0 ? 10 : 0)}%` }"
        />
      </span>
      <span class="t-caption" :class="selected === i ? 'font-semibold text-brand-text' : 'text-muted-foreground'">{{ w.label }}</span>
      <span class="size-1.5 rounded-full" :class="current === i ? 'bg-brand' : 'bg-transparent'" aria-hidden="true" />
    </button>
  </div>
</template>
