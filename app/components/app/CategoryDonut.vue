<script setup lang="ts">
import { VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { formatMoney, formatPercent } from '~/lib/format'

type Slice = { id: string; name: string; total: number; colorVar: string }
const props = defineProps<{ data: Slice[] }>()
const total = computed(() => props.data.reduce((t, d) => t + d.total, 0))
const legend = computed(() => [...props.data].sort((a, b) => b.total - a.total).map((d) => ({ ...d, share: total.value ? d.total / total.value : 0 })))

const config = { total: { label: 'Spent' } } satisfies ChartConfig
const value = (d: Slice) => d.total
const color = (d: Slice) => d.colorVar
const tooltip = { [Donut.selectors.segment]: (d: { data: Slice }) => `<div class="rounded-[10px] border border-line bg-surface px-3 py-2 t-secondary text-ink"><div class="font-medium">${d.data.name}</div><div>${formatMoney(d.data.total)}</div></div>` }
</script>

<template>
  <div class="flex flex-col gap-4">
  <ChartContainer :config="config" class="mx-auto aspect-square h-[200px] w-[200px]" role="img" aria-label="Spending by category">
    <VisSingleContainer :data="data" :height="200">
      <VisDonut :value="value" :color="color" :arc-width="28" :pad-angle="0.02" :corner-radius="3" :central-label="formatMoney(total)" central-sub-label="Spent" />
      <VisTooltip :triggers="tooltip" />
    </VisSingleContainer>
  </ChartContainer>
  <ul class="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Categories in the chart">
    <li v-for="d in legend" :key="d.id" class="flex items-center gap-2 t-secondary">
      <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: d.colorVar }" aria-hidden="true" />
      <span>{{ d.name }}</span>
      <span class="text-muted-foreground">{{ formatPercent(d.share) }}</span>
    </li>
  </ul>
  </div>
</template>
