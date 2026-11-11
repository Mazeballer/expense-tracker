<script setup lang="ts">
import { cn } from '@/lib/utils'
import { formatShortDate } from '~/lib/date'
import { formatMoney } from '~/lib/format'
import type { Week } from '~/lib/weekly'

const props = defineProps<{ weeks: Week[]; selected: number; current: number; average: number }>()
defineEmits<{ select: [index: number] }>()

const HEIGHT = 168
const max = computed(() => Math.max(...props.weeks.map((w) => w.total), props.average, 1) * 1.08)
const barHeight = (total: number) => (total <= 0 ? 0 : Math.max(6, (total / max.value) * HEIGHT))
const averageBottom = computed(() => (props.average / max.value) * HEIGHT)
const label = (w: Week) => formatShortDate(w.from)
const showLabel = (i: number) => (props.weeks.length - 1 - i) % 2 === 0
</script>

<template>
  <div role="radiogroup" aria-label="Spending per week" class="relative">
    <div class="relative flex items-end gap-1.5" :style="{ height: `${HEIGHT}px` }">
      <div
        v-if="average > 0"
        class="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/60"
        :style="{ bottom: `${averageBottom}px` }"
        aria-hidden="true"
      />
      <button
        v-for="(w, i) in weeks"
        :key="w.from"
        type="button"
        role="radio"
        :aria-checked="selected === i"
        :aria-label="`${formatShortDate(w.from)} to ${formatShortDate(w.to)}${current === i ? ', this week' : ''}, ${formatMoney(w.total)}`"
        class="flex h-full min-w-0 flex-1 items-end justify-center"
        @click="$emit('select', i)"
      >
        <span
          :class="cn('w-full max-w-9 rounded-t-lg rounded-b-sm transition-[height,background-color] duration-500 ease-out', selected === i ? 'bg-brand' : 'bg-brand/35')"
          :style="{ height: `${barHeight(w.total)}px` }"
        />
      </button>
    </div>
    <div class="mt-2 flex gap-1.5" aria-hidden="true">
      <span
        v-for="(w, i) in weeks"
        :key="w.from"
        class="t-caption flex-1 whitespace-nowrap text-center"
        :class="[selected === i ? 'font-semibold text-ink' : 'text-muted-foreground', current === i && 'underline decoration-brand decoration-2 underline-offset-4']"
      ><template v-if="showLabel(i) || selected === i">{{ label(w) }}</template></span>
    </div>
  </div>
</template>
