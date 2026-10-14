<script setup lang="ts">
import { PhDownloadSimple, PhMagnifyingGlass, PhPlus } from '@phosphor-icons/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadCsv, toCsv } from '~/lib/csv'
import { formatDay, formatShortDate, klDate, todayKL } from '~/lib/date'
import { formatMoney, round2 } from '~/lib/format'
import type { Expense } from '~/types'

const ALL = 'all'
const { list, remove } = useExpenses()
const { categories, paymentMethods, categoryName, categoryIcon, methodName } = useLookups()
const { show } = useAddSheet()
const month = useSelectedMonth()
const isDesktop = useIsDesktop()

const categoryId = ref(ALL)
const methodId = ref(ALL)
const search = ref('')
const debounced = refDebounced(search, 250)
const searchInput = ref<InstanceType<typeof Input> | null>(null)

const { data, loading, error, reload, mutate } = useResource(
  () => list({
    month: month.value,
    categoryId: categoryId.value === ALL ? undefined : categoryId.value,
    paymentMethodId: methodId.value === ALL ? undefined : methodId.value,
    search: debounced.value,
  }),
  [month, categoryId, methodId, debounced],
)

const { data: allData } = useResource(() => list({}))
const expenses = computed(() => data.value ?? [])
const kindFilter = ref('all')
watch(kindFilter, (k) => { methodId.value = k === 'all' ? ALL : paymentMethods.value.find((m) => m.kind === k)?.id ?? ALL })
const filtering = computed(() => categoryId.value !== ALL || methodId.value !== ALL || debounced.value.trim() !== '')

const groups = computed(() => {
  const map = new Map<string, Expense[]>()
  for (const e of expenses.value) {
    const day = klDate(e.spentAt)
    map.set(day, [...(map.get(day) ?? []), e])
  }
  const today = todayKL()
  return [...map].map(([day, items]) => ({ day, label: formatDay(day, today), items }))
})

const summary = computed(() => {
  const totals = new Map<string, number>()
  for (const e of expenses.value) totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount)
  const top = [...totals].sort((a, b) => b[1] - a[1])[0]
  return {
    total: round2(expenses.value.reduce((t, e) => t + e.amount, 0)),
    count: expenses.value.length,
    top: top ? categoryName(top[0]) : null,
  }
})

const toDelete = ref<Expense | null>(null)
const confirmDelete = (e: Expense) => {
  toDelete.value = null
  mutate((cur) => cur.filter((x) => x.id !== e.id), () => remove(e.id), { success: 'Expense deleted', failure: 'Could not delete. Try again.' })
}

async function exportCsv() {
  try {
    const all = await list({})
    downloadCsv(
      'expenses.csv',
      toCsv(
        ['Date', 'Description', 'Category', 'Payment method', 'Amount', 'Note'],
        all.map((e) => [klDate(e.spentAt), e.description, categoryName(e.categoryId), methodName(e.paymentMethodId), e.amount.toFixed(2), e.note]),
      ),
    )
  } catch {
    toast.error('Could not export. Try again.')
  }
}

useEventListener('keydown', (ev: KeyboardEvent) => {
  const target = ev.target as HTMLElement
  if (ev.key !== '/' || ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return
  ev.preventDefault()
  ;(searchInput.value?.$el as HTMLInputElement | undefined)?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <PageTitle>Expenses</PageTitle>
      <Button variant="outline" class="hidden h-11 gap-2 lg:inline-flex" @click="exportCsv">
        <PhDownloadSimple :size="20" />
        Export CSV
      </Button>
    </div>

    <div class="flex flex-col gap-3">
      <MonthSwitcher v-model="month" />
      <CardSplit :month="month" :expenses="allData ?? []" />
      <Tabs v-model="kindFilter">
        <TabsList class="w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="debit">Debit</TabsTrigger>
          <TabsTrigger value="credit_card">Credit</TabsTrigger>
        </TabsList>
      </Tabs>
      <div class="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_200px]">
        <div class="relative col-span-2 lg:col-span-1">
          <PhMagnifyingGlass :size="20" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref="searchInput" v-model="search" class="h-11 pl-10" placeholder="Search expenses" aria-label="Search expenses" />
        </div>
        <Select v-model="categoryId">
          <SelectTrigger class="h-11 w-full" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">All categories</SelectItem>
            <SelectItem v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
          </SelectContent>
        </Select>

      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1fr_240px]">
      <section aria-label="Expenses list" class="min-w-0">
        <template v-if="loading">
          <Skeleton v-if="isDesktop" class="mb-3 h-8 w-full" />
          <ExpenseListSkeleton :rows="8" />
        </template>
        <ErrorState v-else-if="error" what="expenses" @retry="reload" />
        <EmptyState
          v-else-if="!expenses.length && filtering"
          :message="debounced.trim() ? `No expenses match &quot;${debounced.trim()}&quot;. Try a different word.` : 'No expenses match these filters. Try different ones.'"
        />
        <EmptyState v-else-if="!expenses.length" message="No expenses this month. Add one to start." action="Add expense" @action="show()" />

        <Table v-else-if="isDesktop">
          <TableHeader>
            <TableRow>
              <TableHead class="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="w-12"><span class="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="e in expenses" :key="e.id" class="cursor-pointer" @click="show(e)">
              <TableCell class="text-muted-foreground">{{ formatShortDate(klDate(e.spentAt)) }}</TableCell>
              <TableCell class="font-medium">
                <span class="mr-2" aria-hidden="true">{{ categoryIcon(e.categoryId) }}</span>{{ e.description }}
                <span v-if="e.paymentMethodId" class="ml-2 t-caption text-muted-foreground">{{ methodName(e.paymentMethodId) }}</span>
              </TableCell>
              <TableCell>{{ categoryName(e.categoryId) }}</TableCell>
              <TableCell class="text-right font-medium">{{ formatMoney(e.amount) }}</TableCell>
              <TableCell @click.stop>
                <ExpenseActions :expense="e" @edit="show(e)" @remove="toDelete = e" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div v-else class="flex flex-col gap-6">
          <div v-for="g in groups" :key="g.day">
            <h2 class="t-secondary mb-1 font-medium text-muted-foreground">{{ g.label }}</h2>
            <ul class="border-t border-line">
              <ExpenseRow v-for="e in g.items" :key="e.id" :expense="e" menu @edit="show(e)" @remove="toDelete = e" />
            </ul>
          </div>
        </div>
      </section>

      <aside v-if="isDesktop" aria-label="Month summary" class="flex flex-col gap-4">
        <h2 class="t-heading">Summary</h2>
        <dl class="flex flex-col divide-y divide-line border-y border-line">
          <div class="flex items-baseline justify-between py-3"><dt class="text-muted-foreground">Total</dt><dd class="font-medium">{{ formatMoney(summary.total) }}</dd></div>
          <div class="flex items-baseline justify-between py-3"><dt class="text-muted-foreground">Expenses</dt><dd class="font-medium">{{ summary.count }}</dd></div>
          <div class="flex items-baseline justify-between gap-3 py-3"><dt class="text-muted-foreground">Top category</dt><dd class="text-right font-medium">{{ summary.top ?? 'None' }}</dd></div>
        </dl>
      </aside>
    </div>

    <DeleteExpenseDialog v-model="toDelete" @confirm="confirmDelete" />
  </div>
</template>
