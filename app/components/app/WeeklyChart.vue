<script setup lang="ts">
import { cn } from '@/lib/utils'
import { formatMoney } from '~/lib/format'
import { dayRange, type MonthWeek } from '~/lib/weekly'

const props = defineProps<{ weeks: MonthWeek[]; selected: number | null; current: number; average: number }>()
defineEmits<{ select: [index: number] }>()

const HEIGHT = 176
const max = computed(() => Math.max(...props.weeks.map((w) => w.total), props.average, 1) * 1.12)
const barHeight = (total: number) => (total <= 0 ? 0 : Math.max(8, (total / max.value) * HEIGHT))
const averageBottom = computed(() => (props.average / max.value) * HEIGHT)
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n)))
</script>

<template>
  <div role="radiogroup" aria-label="Spending per week">
    <div class="relative flex items-end gap-3" :style="{ height: `${HEIGHT + 22}px` }">
      <div
        v-if="average > 0"
        class="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
        :style="{ bottom: `${averageBottom}px` }"
        aria-hidden="true"
      />
      <button
        v-for="(w, i) in weeks"
        :key="w.from"
        type="button"
        role="radio"
        :aria-checked="selected === i"
        :aria-label="`Week ${w.number}, days ${dayRange(w)}${current === i ? ', this week' : ''}, ${formatMoney(w.total)}`"
        class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
        @click="$emit('select', i)"
      >
        <span class="t-caption" :class="selected === i ? 'font-semibold text-ink' : 'text-muted-foreground'">{{ w.total > 0 ? compact(w.total) : '' }}</span>
        <span
          :class="cn('w-full max-w-14 rounded-t-xl rounded-b-md transition-[height,background-color] duration-500 ease-out', selected === i ? 'bg-brand' : 'bg-brand/30', w.total <= 0 && 'bg-line')"
          :style="{ height: `${w.total > 0 ? barHeight(w.total) : 4}px` }"
        />
      </button>
    </div>
    <div class="mt-2 flex gap-3" aria-hidden="true">
      <div v-for="(w, i) in weeks" :key="w.from" class="flex min-w-0 flex-1 flex-col items-center">
        <span class="t-caption" :class="selected === i ? 'font-semibold text-ink' : 'text-muted-foreground'">Week {{ w.number }}</span>
        <span class="t-caption text-muted-foreground">{{ dayRange(w) }}</span>
        <span class="mt-1 size-1.5 rounded-full" :class="current === i ? 'bg-brand' : 'bg-transparent'" />
      </div>
    </div>
  </div>
</template>
