<script setup lang="ts">
import { VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { formatMoney } from '~/lib/format'

type Slice = { id: string; name: string; total: number; colorVar: string }
defineProps<{ data: Slice[] }>()

const config = { total: { label: 'Spent' } } satisfies ChartConfig
const value = (d: Slice) => d.total
const color = (d: Slice) => d.colorVar
const tooltip = { [Donut.selectors.segment]: (d: { data: Slice }) => `<div class="rounded-[10px] border border-line bg-surface px-3 py-2 t-secondary text-ink"><div class="font-medium">${d.data.name}</div><div>${formatMoney(d.data.total)}</div></div>` }
</script>

<template>
  <ChartContainer :config="config" class="mx-auto aspect-square h-[200px] w-[200px]" role="img" aria-label="Spending by category">
    <VisSingleContainer :data="data" :height="200">
      <VisDonut :value="value" :color="color" :arc-width="28" :pad-angle="0.02" :corner-radius="3" />
      <VisTooltip :triggers="tooltip" />
    </VisSingleContainer>
  </ChartContainer>
</template>
