<script setup lang="ts">
import { VisAxis, VisLine, VisScatter, VisXYContainer } from '@unovis/vue'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { formatShortDate } from '~/lib/date'
import { formatMoney } from '~/lib/format'
import type { Valuation } from '~/types'

const props = defineProps<{ points: Valuation[]; name: string }>()
const config = { value: { label: 'Value', color: 'var(--chart-1)' } } satisfies ChartConfig
const x = (d: Valuation) => new Date(`${d.asOf}T00:00:00Z`).getTime()
const y = (d: Valuation) => d.value
const tickFormat = (t: number) => formatShortDate(new Date(t).toISOString().slice(0, 10))
const label = computed(() => `${props.name} value over time`)
</script>

<template>
  <ChartContainer :config="config" class="aspect-auto h-[140px] w-full" role="img" :aria-label="label">
    <VisXYContainer :data="points" :margin="{ top: 8, right: 8, bottom: 0, left: 0 }">
      <VisLine :x="x" :y="y" color="var(--brand)" />
      <VisScatter :x="x" :y="y" color="var(--brand)" :size="6" />
      <VisAxis type="x" :num-ticks="4" :tick-format="tickFormat" :tick-line="false" :domain-line="false" :grid-line="false" />
      <VisAxis type="y" :num-ticks="3" :tick-format="(v: number) => formatMoney(v).replace('.00', '')" :tick-line="false" :domain-line="false" />
    </VisXYContainer>
  </ChartContainer>
</template>
