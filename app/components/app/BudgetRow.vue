<script setup lang="ts">
import { formatMoney } from '~/lib/format'
import type { BudgetFigures } from '~/lib/budget'

defineProps<{ name: string; icon: string; figures: BudgetFigures; editable?: boolean }>()
defineEmits<{ edit: [] }>()
</script>

<template>
  <li class="border-b border-line last:border-b-0">
    <component :is="editable ? 'button' : 'div'" :type="editable ? 'button' : undefined" class="flex min-h-[72px] w-full flex-col justify-center gap-2 py-3 text-left" @click="editable && $emit('edit')">
      <span class="flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-3">
          <IconBubble :icon="icon" />
          <span class="truncate font-medium">{{ name }}</span>
        </span>
        <span class="t-secondary shrink-0" :class="figures.status === 'reached' ? 'text-alert' : figures.status === 'near' ? 'text-warn-text' : 'text-muted-foreground'">
          {{ figures.over > 0 ? `${formatMoney(figures.over)} over` : figures.status === 'reached' ? 'Budget reached' : `${formatMoney(figures.left)} left` }}
        </span>
      </span>
      <span class="h-3 w-full overflow-hidden rounded-full bg-line" role="progressbar" :aria-label="`${name} budget used`" :aria-valuenow="Math.round(figures.progress * 100)" aria-valuemin="0" aria-valuemax="100">
        <span class="block h-full rounded-full" :class="figures.status === 'reached' ? 'bg-alert' : figures.status === 'near' ? 'bg-warn' : 'bg-brand'" :style="{ width: `${figures.progress * 100}%` }" />
      </span>
      <span class="t-caption text-muted-foreground">{{ formatMoney(figures.spent) }} of {{ formatMoney(figures.limit) }}</span>
    </component>
  </li>
</template>
