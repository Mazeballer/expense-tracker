<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CategoryRow } from '~/components/app/CategoryTable.vue'
import { addMonths, currentMonth, formatMonthShort, monthName, monthRange } from '~/lib/date'
import { epfRateAt, leftToSpend, planSummary, savingsTotals } from '~/lib/finance'
import { round2 } from '~/lib/format'
import type { Expense } from '~/types'

const { list } = useExpenses()
const { totals } = useMonthTotals()
const { all: allPlan } = usePlan()
const { get: getSettings } = useSettings()
const loadSavings = useSavingsData()
const { categories } = useLookups()
const { show } = useAddSheet()
const deleteExpense = useDeleteExpense()
const toDelete = ref<Expense | null>(null)
const confirmDelete = async (e: Expense) => { toDelete.value = null; await deleteExpense(e) }
const month = ref(currentMonth())
const isDesktop = useIsDesktop()

const { data, loading, error, reload } = useResource(async () => {
  const [monthTotals, plan, settings, recent, savings] = await Promise.all([
    totals(addMonths(month.value, -12), month.value),
    allPlan(),
    getSettings(),
    list({ month: month.value }),
    loadSavings(),
  ])
  return { monthTotals, plan, settings, recent: recent.slice(0, 10), savings }
}, [month])

const monthSum = (m: string) => round2((data.value?.monthTotals ?? []).filter((t) => t.month === m).reduce((s, t) => s + t.total, 0))

const plan = computed(() => data.value ? planSummary(data.value.plan, epfRateAt(data.value.settings.epfRates, month.value), month.value) : null)
const figures = computed(() => plan.value ? leftToSpend(plan.value, monthSum(month.value)) : null)

const trend = computed(() => monthRange(month.value, 12).map((m) => ({ month: m, label: formatMonthShort(m), total: monthSum(m) })))

const colorVar = (id: string) => `var(--chart-${(Math.max(0, categories.value.findIndex((c) => c.id === id)) % 7) + 1})`

const categoryRows = computed<CategoryRow[]>(() => {
  const t = data.value?.monthTotals ?? []
  const current = t.filter((x) => x.month === month.value)
  const prev = t.filter((x) => x.month === addMonths(month.value, -1))
  const total = current.reduce((s, x) => s + x.total, 0)
  return current
    .map((x) => ({
      id: x.categoryId,
      name: categories.value.find((c) => c.id === x.categoryId)?.name ?? '',
      total: x.total,
      share: total ? x.total / total : 0,
      change: prev.length ? round2(x.total - (prev.find((p) => p.categoryId === x.categoryId)?.total ?? 0)) : null,
      colorVar: colorVar(x.categoryId),
    }))
    .sort((a, b) => b.total - a.total)
})

const donut = computed(() => categoryRows.value.map((r) => ({ id: r.id, name: r.name, total: r.total, colorVar: r.colorVar })))

const savingsTotal = computed(() => {
  const s = data.value?.savings
  return s ? savingsTotals(s.accounts, s.txs, s.vals, s.settings.savingsGoal) : null
})

const recent = computed(() => (data.value?.recent ?? []).slice(0, isDesktop.value ? 10 : 5))
const edit = (e: Expense) => show(e)
</script>

<template>
  <div class="flex flex-col gap-8">
    <ProfileHeader />

    <HomeSkeleton v-if="loading" />
    <ErrorState v-else-if="error || !data || !plan || !figures" what="expenses" @retry="reload" />
    <template v-else>
      <div class="grid gap-8 max-lg:contents lg:grid-cols-12">
        <div class="flex flex-col gap-3 max-lg:order-1 lg:col-span-5">
          <LeftToSpendHero :plan="plan" :figures="figures" :month="month" />
        </div>

        <section v-if="isDesktop" class="lg:col-span-7" aria-label="Spending trend">
          <h2 class="t-heading mb-3">Last 12 months</h2>
          <TrendChart :data="trend" :selected="month" />
        </section>
        <Tabs v-else default-value="trend" class="order-3">
          <TabsList class="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="trend" class="h-9">Trend</TabsTrigger>
            <TabsTrigger value="categories" class="h-9">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="trend" class="pt-4"><TrendChart :data="trend" :selected="month" bleed /></TabsContent>
          <TabsContent value="categories" class="flex flex-col gap-4 pt-4">
            <EmptyState v-if="!categoryRows.length" message="No expenses this month. Add one to start." action="Add expense" @action="show()" />
            <template v-else>
              <LazyCategoryDonut :data="donut" />
              <CategoryTable :rows="categoryRows" />
            </template>
          </TabsContent>
        </Tabs>

        <section v-if="isDesktop" class="grid gap-8 lg:col-span-12 lg:grid-cols-12" aria-label="Spending by category">
          <div class="lg:col-span-5">
            <h2 class="t-heading mb-3">Categories in {{ monthName(month) }}</h2>
            <LazyCategoryDonut v-if="categoryRows.length" :data="donut" />
          </div>
          <div class="lg:col-span-7">
            <CategoryTable v-if="categoryRows.length" :rows="categoryRows" />
            <EmptyState v-else message="No expenses this month. Add one to start." action="Add expense" @action="show()" />
          </div>
        </section>
      </div>

      <div class="grid gap-8 max-lg:contents lg:grid-cols-12">
        <section class="max-lg:order-2 lg:col-span-8" aria-label="Recent expenses">
          <div class="mb-1 flex items-baseline justify-between">
            <h2 class="t-heading">Recent expenses</h2>
            <NuxtLink to="/expenses" class="flex min-h-11 items-center text-brand-text">See all</NuxtLink>
          </div>
          <ul v-if="recent.length" class="border-t border-line">
            <ExpenseRow v-for="e in recent" :key="e.id" :expense="e" menu @edit="edit(e)" @remove="toDelete = e" />
          </ul>
          <EmptyState v-else message="No expenses this month. Add one to start." action="Add expense" @action="show()" />
        </section>
        <div class="max-lg:order-4 lg:col-span-4">
          <SavingsSummary v-if="savingsTotal" :total="savingsTotal.total" :goal="savingsTotal.goal" :progress="savingsTotal.progress" />
        </div>
      </div>
    </template>
  </div>
  <DeleteExpenseDialog v-model="toDelete" @confirm="confirmDelete" />
</template>
