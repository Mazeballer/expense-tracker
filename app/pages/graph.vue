<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { currentMonth, formatMonth, klDate, todayKL } from '~/lib/date'
import { formatMoney, round2 } from '~/lib/format'
import { dayRange, monthWeeks } from '~/lib/weekly'

const { list } = useExpenses()
const { categories } = useLookups()
const { show } = useAddSheet()
const month = useSelectedMonth()

const { data, loading, error, reload } = useResource(() => list({ month: month.value }), [month])

const expenses = computed(() => data.value ?? [])
const weeks = computed(() => monthWeeks(expenses.value, month.value))
const monthTotal = computed(() => round2(weeks.value.reduce((t, w) => t + w.total, 0)))
const current = computed(() => (month.value === currentMonth() ? weeks.value.findIndex((w) => todayKL() >= w.from && todayKL() <= w.to) : -1))

// A tapped week shows its own breakdown. Tapping it again goes back to the whole month.
const picked = ref<number | null>(null)
watch(month, () => { picked.value = null })
const toggle = (i: number) => { picked.value = picked.value === i ? null : i }
const week = computed(() => (picked.value === null ? null : weeks.value[picked.value] ?? null))

// Average over weeks that have fully or partly passed, spread over their days, so a short last week is not unfair.
const average = computed(() => {
  const started = weeks.value.filter((w) => month.value < currentMonth() || (month.value === currentMonth() && w.from <= todayKL()))
  const days = started.reduce((t, w) => t + w.days, 0)
  return days ? round2((started.reduce((t, w) => t + w.total, 0) / days) * 7) : 0
})

const scope = computed(() => (week.value ? expenses.value.filter((e) => { const d = klDate(e.spentAt); return d >= week.value!.from && d <= week.value!.to }) : expenses.value))
const scopeTotal = computed(() => round2(scope.value.reduce((t, e) => t + e.amount, 0)))
const byCategory = computed(() => {
  const sums = new Map<string, number>()
  for (const e of scope.value) sums.set(e.categoryId, (sums.get(e.categoryId) ?? 0) + e.amount)
  return [...sums.entries()]
    .map(([id, total]) => {
      const c = categories.value.find((x) => x.id === id)
      return { id, total: round2(total), name: c?.name ?? 'Others', icon: c?.icon ?? '🧾', share: scopeTotal.value ? total / scopeTotal.value : 0 }
    })
    .sort((a, b) => b.total - a.total)
})
</script>

<template>
  <div class="flex max-w-xl flex-col gap-6">
    <PageTitle>Graph</PageTitle>
    <MonthSwitcher v-model="month" />

    <div v-if="loading" class="flex flex-col gap-4" aria-hidden="true"><Skeleton class="h-16 w-full" /><Skeleton class="h-56 w-full" /><Skeleton class="h-40 w-full" /></div>
    <ErrorState v-else-if="error || !data" what="spending" @retry="reload" />
    <EmptyState v-else-if="!expenses.length" :message="`No expenses in ${formatMonth(month)}.`" action="Add expense" @action="show()" />
    <template v-else>
      <section aria-label="Spending by week" class="flex flex-col gap-5">
        <div aria-live="polite">
          <p class="t-secondary text-muted-foreground">{{ week ? `Week ${week.number}, days ${dayRange(week)}` : `${formatMonth(month)}, all weeks` }}</p>
          <p class="t-title">{{ formatMoney(week ? week.total : monthTotal) }}</p>
          <p class="t-secondary text-muted-foreground">About {{ formatMoney(average) }} a week</p>
        </div>
        <WeeklyChart :weeks="weeks" :selected="picked" :current="current" :average="average" @select="toggle" />
        <p class="t-caption text-muted-foreground">Tap a week to see where it went. The dashed line is your weekly average.</p>
      </section>

      <section aria-label="Where it went" class="flex flex-col">
        <div class="mb-1 flex items-center justify-between">
          <h2 class="t-heading">Where it went</h2>
          <Button v-if="week" variant="ghost" class="h-11" @click="picked = null">Whole month</Button>
        </div>
        <ul class="border-t border-line">
          <li v-for="c in byCategory" :key="c.id" class="flex min-h-14 items-center gap-3 border-b border-line">
            <IconBubble :icon="c.icon" />
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ c.name }}</span>
              <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-line"><span class="block h-full rounded-full bg-brand" :style="{ width: `${Math.max(c.share * 100, 3)}%` }" /></span>
            </span>
            <span class="font-medium">{{ formatMoney(c.total) }}</span>
          </li>
          <li v-if="!byCategory.length" class="flex min-h-14 items-center text-muted-foreground">Nothing spent this week.</li>
        </ul>
      </section>
    </template>
  </div>
</template>
