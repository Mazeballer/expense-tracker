<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { addMonths, currentMonth, formatMonthShort, formatShortDate, klDate, monthRange, todayKL } from '~/lib/date'
import { formatMoney, round2 } from '~/lib/format'
import { lastWeeks, monthsCovering } from '~/lib/weekly'

const WEEKS = 12
const { list } = useExpenses()
const { totals } = useMonthTotals()
const { categories } = useLookups()
const { show } = useAddSheet()

const month = currentMonth()
const today = todayKL()
const selected = ref(WEEKS - 1)

const { data, loading, error, reload } = useResource(async () => {
  const months = monthsCovering(lastWeeks([], today, WEEKS))
  const [lists, monthTotals] = await Promise.all([
    Promise.all(months.map((m) => list({ month: m }))),
    totals(addMonths(month, -11), month),
  ])
  return { expenses: lists.flat(), monthTotals }
})

const weeks = computed(() => lastWeeks(data.value?.expenses ?? [], today, WEEKS))
const current = WEEKS - 1
// Average over the weeks that are finished, so a week still in progress does not pull it down.
const average = computed(() => {
  const done = weeks.value.slice(0, current)
  return done.length ? round2(done.reduce((t, w) => t + w.total, 0) / done.length) : 0
})
const picked = computed(() => weeks.value[selected.value]!)
const busiest = computed(() => weeks.value.reduce((best, w) => (w.total > best.total ? w : best), weeks.value[0]!))
const vsAverage = computed(() => (average.value > 0 && selected.value !== current ? round2(picked.value.total - average.value) : null))

const byCategory = computed(() => {
  const from = picked.value.from
  const to = picked.value.to
  const sums = new Map<string, number>()
  for (const e of data.value?.expenses ?? []) {
    const day = klDate(e.spentAt)
    if (day >= from && day <= to) sums.set(e.categoryId, (sums.get(e.categoryId) ?? 0) + e.amount)
  }
  return [...sums.entries()]
    .map(([id, total]) => ({ id, total: round2(total), name: categories.value.find((c) => c.id === id)?.name ?? 'Others', icon: categories.value.find((c) => c.id === id)?.icon ?? '🧾' }))
    .sort((a, b) => b.total - a.total)
})

const trend = computed(() => monthRange(month, 12).map((m) => ({
  month: m,
  label: formatMonthShort(m),
  total: round2((data.value?.monthTotals ?? []).filter((t) => t.month === m).reduce((s, t) => s + t.total, 0)),
})))

const range = (w: { from: string; to: string }) => `${formatShortDate(w.from)} to ${formatShortDate(w.to)}`
</script>

<template>
  <div class="flex max-w-xl flex-col gap-8">
    <PageTitle>Graph</PageTitle>

    <div v-if="loading" class="flex flex-col gap-4" aria-hidden="true"><Skeleton class="h-6 w-48" /><Skeleton class="h-52 w-full" /><Skeleton class="h-40 w-full" /></div>
    <ErrorState v-else-if="error || !data" what="spending" @retry="reload" />
    <template v-else>
      <section aria-label="Weekly spending" class="flex flex-col gap-4">
        <div>
          <h2 class="t-heading">Weekly spending</h2>
          <p class="t-secondary text-muted-foreground">The last {{ WEEKS }} weeks, Monday to Sunday. Tap a bar to see that week.</p>
        </div>
        <div aria-live="polite">
          <p class="t-secondary text-muted-foreground">{{ selected === current ? 'This week' : range(picked) }}<template v-if="selected === current">, {{ range(picked) }}</template></p>
          <p class="t-title">{{ formatMoney(picked.total) }}</p>
          <p v-if="vsAverage !== null" class="t-secondary text-muted-foreground">{{ vsAverage > 0 ? `${formatMoney(vsAverage)} above` : vsAverage < 0 ? `${formatMoney(-vsAverage)} below` : 'Same as' }} your weekly average</p>
        </div>
        <WeeklyChart :weeks="weeks" :selected="selected" :current="current" :average="average" @select="selected = $event" />
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-2xl border border-line bg-surface p-4">
            <dt class="t-secondary text-muted-foreground">Weekly average</dt>
            <dd class="mt-1 font-semibold">{{ formatMoney(average) }}</dd>
          </div>
          <div class="rounded-2xl border border-line bg-surface p-4">
            <dt class="t-secondary text-muted-foreground">Busiest week</dt>
            <dd class="mt-1 font-semibold">{{ formatMoney(busiest.total) }}</dd>
            <dd class="t-caption text-muted-foreground">{{ formatShortDate(busiest.from) }}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Where it went" class="flex flex-col gap-1">
        <h2 class="t-heading">Where it went</h2>
        <p class="t-secondary mb-2 text-muted-foreground">{{ range(picked) }}</p>
        <EmptyState v-if="!byCategory.length" message="No expenses this week." action="Add expense" @action="show()" />
        <ul v-else class="border-t border-line">
          <li v-for="c in byCategory" :key="c.id" class="flex min-h-14 items-center gap-3 border-b border-line">
            <IconBubble :icon="c.icon" />
            <span class="min-w-0 flex-1 truncate">{{ c.name }}</span>
            <span class="font-medium">{{ formatMoney(c.total) }}</span>
          </li>
        </ul>
      </section>

      <section aria-label="Spending by month" class="flex flex-col gap-3">
        <h2 class="t-heading">Last 12 months</h2>
        <TrendChart :data="trend" :selected="month" />
      </section>
    </template>
  </div>
</template>
