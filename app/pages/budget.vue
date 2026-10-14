<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { budgetFigures, limitFor, monthPeriod, spentIn, weeksOfMonth } from '~/lib/budget'
import type { WeekBar } from '~/components/app/WeekStrip.vue'
import { currentMonth, formatShortDate, todayKL } from '~/lib/date'
import { formatMoney, round2 } from '~/lib/format'
import type { Budget } from '~/types'

const budgetsApi = useBudgets()
const { list } = useExpenses()
const { categories, categoryName, categoryIcon } = useLookups()
const month = useSelectedMonth()

const view = ref<'month' | 'week'>('month')
const weekIndex = ref(0)

const { data, loading, error, reload } = useResource(async () => {
  const [budgets, expenses] = await Promise.all([budgetsApi.list(), list({ month: month.value })])
  return { budgets, expenses }
}, [month])

const weeks = computed(() => weeksOfMonth(month.value))
watch(month, () => {
  const today = todayKL()
  const current = weeks.value.findIndex((w) => today >= w.from && today <= w.to)
  weekIndex.value = current >= 0 ? current : 0
}, { immediate: true })

const period = computed(() => (view.value === 'month' ? monthPeriod(month.value) : weeks.value[Math.min(weekIndex.value, weeks.value.length - 1)]!))
const currentWeek = computed(() => (month.value === currentMonth() ? weeks.value.findIndex((w) => todayKL() >= w.from && todayKL() <= w.to) : -1))
const weekBars = computed<WeekBar[]>(() => {
  const spentPerWeek = weeks.value.map((w) => spentIn(expenses.value, w))
  const totalBudgeted = round2(categoryBudgets.value.reduce((t, b) => t + b.amount, 0))
  const monthly = overall.value?.amount ?? (totalBudgeted > 0 ? totalBudgeted : null)
  const biggest = Math.max(...spentPerWeek, 1)
  return weeks.value.map((w, i) => {
    const started = month.value < currentMonth() || (month.value === currentMonth() && w.from <= todayKL())
    if (monthly === null) return { progress: spentPerWeek[i]! / biggest, status: null, started }
    const f = budgetFigures(limitFor(monthly, month.value, w), spentPerWeek[i]!)
    return { progress: f.progress, status: f.status, started }
  })
})

const overall = computed(() => data.value?.budgets.find((b) => b.categoryId === null) ?? null)
const categoryBudgets = computed(() =>
  (data.value?.budgets ?? [])
    .filter((b): b is Budget & { categoryId: string } => b.categoryId !== null && categories.value.some((c) => c.id === b.categoryId && !c.archived))
    .sort((a, b) => categories.value.findIndex((c) => c.id === a.categoryId) - categories.value.findIndex((c) => c.id === b.categoryId)))

const expenses = computed(() => data.value?.expenses ?? [])
const overallFigures = computed(() => overall.value ? budgetFigures(limitFor(overall.value.amount, month.value, period.value), spentIn(expenses.value, period.value)) : null)
const rows = computed(() => categoryBudgets.value.map((b) => ({
  budget: b,
  figures: budgetFigures(limitFor(b.amount, month.value, period.value), spentIn(expenses.value, period.value, b.categoryId)),
})))
const unbudgeted = computed(() => {
  if (!rows.value.length) return 0
  const budgeted = rows.value.reduce((t, r) => t + r.figures.spent, 0)
  return round2(spentIn(expenses.value, period.value) - budgeted)
})
const overAllocated = computed(() => {
  if (!overall.value) return 0
  const total = round2(categoryBudgets.value.reduce((t, b) => t + b.amount, 0))
  return total > overall.value.amount ? round2(total - overall.value.amount) : 0
})

const available = computed(() => [
  ...(overall.value ? [] : [{ id: null as string | null, name: 'Overall' }]),
  ...categories.value.filter((c) => !c.archived && !categoryBudgets.value.some((b) => b.categoryId === c.id)).map((c) => ({ id: c.id as string | null, name: c.name })),
])

const sheet = reactive({ open: false, budget: null as Budget | null, target: undefined as string | null | undefined })
const openSheet = (budget: Budget | null = null, target?: string | null) => Object.assign(sheet, { open: true, budget, target })
const sheetTitle = computed(() => (sheet.budget ? (sheet.budget.categoryId ? `${categoryName(sheet.budget.categoryId)} budget` : 'Monthly budget') : 'Add budget'))
const sheetTargets = computed(() => (sheet.budget ? [] : available.value))

async function save(v: { categoryId: string | null; amount: number }) {
  if (await runSave(() => budgetsApi.set(v), 'Budget saved')) sheet.open = false
}
async function removeBudget() {
  const b = sheet.budget
  if (b && await runSave(() => budgetsApi.remove(b.id), 'Budget removed')) sheet.open = false
}

const rangeLabel = computed(() => (view.value === 'week' ? `${formatShortDate(period.value.from)} to ${formatShortDate(period.value.to)}` : ''))
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageTitle>Budget</PageTitle>
    <MonthSwitcher v-model="month" />

    <div v-if="loading" class="flex flex-col gap-6" aria-hidden="true">
      <Skeleton class="h-11 w-full" />
      <div class="flex flex-col gap-3"><Skeleton class="h-10 w-48" /><Skeleton class="h-3 w-full" /><Skeleton class="h-4 w-40" /></div>
      <ExpenseListSkeleton :rows="3" />
    </div>
    <ErrorState v-else-if="error || !data" what="budgets" @retry="reload" />
    <template v-else>
      <EmptyState v-if="!overall && !categoryBudgets.length" message="No budget set. Set a monthly budget to see how much is left." action="Set budget" @action="openSheet(null, null)" />

      <template v-else>
        <Tabs v-model="view">
          <TabsList class="grid h-11 w-full grid-cols-2 lg:w-80">
            <TabsTrigger value="month" class="h-9">Month</TabsTrigger>
            <TabsTrigger value="week" class="h-9">Week</TabsTrigger>
          </TabsList>
        </Tabs>

        <div v-if="view === 'week'" class="flex flex-col gap-2">
          <WeekStrip :weeks="weeks" :bars="weekBars" :selected="weekIndex" :current="currentWeek" @select="weekIndex = $event" />
          <p class="t-secondary text-muted-foreground">{{ rangeLabel }}</p>
        </div>

        <section v-if="overall && overallFigures" aria-label="Overall budget" class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-muted-foreground">{{ view === 'month' ? 'Monthly budget' : 'Weekly budget' }}</p>
              <p class="t-title mt-1" :class="overallFigures.status === 'reached' ? 'text-alert' : overallFigures.status === 'near' ? 'text-warn-text' : ''">
                {{ overallFigures.over > 0 ? `${formatMoney(overallFigures.over)} over` : overallFigures.status === 'reached' ? 'Budget reached' : `${formatMoney(overallFigures.left)} left` }}
              </p>
            </div>
            <Button v-if="view === 'month'" variant="secondary" class="h-11 px-5" @click="openSheet(overall)">Edit</Button>
          </div>
          <div class="h-3 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Budget used" :aria-valuenow="Math.round(overallFigures.progress * 100)" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full" :class="overallFigures.status === 'reached' ? 'bg-alert' : overallFigures.status === 'near' ? 'bg-warn' : 'bg-brand'" :style="{ width: `${overallFigures.progress * 100}%` }" />
          </div>
          <p class="t-secondary text-muted-foreground">{{ formatMoney(overallFigures.spent) }} of {{ formatMoney(overallFigures.limit) }} spent</p>
        </section>
        <section v-else aria-label="Overall budget" class="flex items-center justify-between gap-3 border-y border-line py-4">
          <p class="text-muted-foreground">No monthly budget yet.</p>
          <Button class="h-11" @click="openSheet(null, null)">Set budget</Button>
        </section>

        <p v-if="overAllocated > 0" class="t-secondary text-muted-foreground" role="status">
          Your category budgets add up to {{ formatMoney(overAllocated) }} more than your monthly budget.
        </p>

        <section aria-label="Category budgets" class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <h2 class="t-heading">Categories</h2>
            <Button v-if="view === 'month' && available.some((a) => a.id !== null)" variant="secondary" class="h-11" @click="openSheet(null, available.find((a) => a.id !== null)?.id)">Add category budget</Button>
          </div>
          <p v-if="!rows.length" class="py-4 text-muted-foreground">No category budgets yet.</p>
          <ul v-else class="flex flex-col">
            <BudgetRow v-for="r in rows" :key="r.budget.id" :name="categoryName(r.budget.categoryId)" :icon="categoryIcon(r.budget.categoryId)" :figures="r.figures" :editable="view === 'month'" @edit="openSheet(r.budget)" />
          </ul>
          <p v-if="rows.length && unbudgeted > 0" class="t-secondary border-t border-line pt-3 text-muted-foreground">{{ formatMoney(unbudgeted) }} spent in categories without a budget.</p>
        </section>
      </template>
    </template>

    <ResponsiveSheet v-model:open="sheet.open" :title="sheetTitle">
      <BudgetForm
        v-if="sheet.open"
        :key="`${sheet.budget?.id ?? 'new'}-${sheet.target}`"
        :budget="sheet.budget"
        :targets="sheetTargets"
        :initial-target="sheet.target"
        :on-save="save"
        :on-remove="removeBudget"
      />
    </ResponsiveSheet>
  </div>
</template>
