<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { currentMonth, formatMonth } from '~/lib/date'
import { activeItems, epfRateAt, planSummary } from '~/lib/finance'
import { formatMoney, formatPercent } from '~/lib/format'
import type { PlanItem, PlanKind } from '~/types'

const planApi = usePlan()
const settingsApi = useSettings()
const month = ref(currentMonth())

const { data, loading, error, reload } = useResource(async () => {
  const [items, settings] = await Promise.all([planApi.all(), settingsApi.get()])
  return { items, settings }
})

const active = computed(() => data.value ? activeItems(data.value.items, month.value) : [])
const summary = computed(() => data.value ? planSummary(data.value.items, epfRate.value, month.value) : null)
const epfRate = computed(() => (data.value ? epfRateAt(data.value.settings.epfRates, month.value) : 0))
const ofKind = (kind: PlanKind) => active.value.filter((i) => i.kind === kind)
const sectionTotal = (kind: PlanKind) => ofKind(kind).reduce((t, i) => t + i.amount, 0)

type LineSheet = { open: boolean; kind: PlanKind; item: PlanItem | null }
const lineSheet = reactive<LineSheet>({ open: false, kind: 'income', item: null })
const renameSheet = reactive({ open: false, item: null as PlanItem | null })
const removing = ref<PlanItem | null>(null)
const removeOpen = computed({ get: () => removing.value !== null, set: (v) => { if (!v) removing.value = null } })

const rateSheet = ref(false)
const openLine = (kind: PlanKind, item: PlanItem | null = null) => Object.assign(lineSheet, { open: true, kind, item })
const openRename = (item: PlanItem) => Object.assign(renameSheet, { open: true, item })

async function saveLine(v: { label: string; amount: number; fromMonth: string }) {
  const item = lineSheet.item
  const ok = await runSave(
    () => (item ? planApi.change(item.groupKey, v.amount, v.fromMonth) : planApi.add({ kind: lineSheet.kind, label: v.label, amount: v.amount, effectiveFrom: v.fromMonth })),
    item ? 'Changes saved' : 'Line added',
  )
  if (ok) lineSheet.open = false
}

async function saveRate(v: { rate: number; fromMonth: string }) {
  if (await runSave(() => settingsApi.changeEpfRate(v.rate, v.fromMonth), 'Changes saved')) rateSheet.value = false
}

async function saveRename(name: string) {
  const item = renameSheet.item
  if (item && await runSave(() => planApi.rename(item.groupKey, name), 'Changes saved')) renameSheet.open = false
}

async function confirmRemove() {
  const item = removing.value
  removing.value = null
  if (item) await runSave(() => planApi.end(item.groupKey, month.value), 'Line deleted')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Income and costs</PageTitle>
    </div>

    <div v-if="loading" class="flex flex-col gap-3" aria-hidden="true"><Skeleton v-for="i in 3" :key="i" class="h-32 w-full" /></div>
    <ErrorState v-else-if="error || !data || !summary" what="plan" @retry="reload" />
    <div v-else class="grid gap-8 lg:grid-cols-12">
      <div class="flex flex-col gap-8 lg:col-span-7">
        <PlanSection title="Income" :items="ofKind('income')" :total="summary.gross" @add="openLine('income')" @edit="openLine('income', $event)" @rename="openRename" @remove="removing = $event" />
        <PlanSection
          title="Deductions"
          :items="ofKind('deduction')"
          :computed-rows="[{ label: `EPF (${formatPercent(epfRate)} of income)`, amount: summary.epf }]"
          :total="summary.deductions"
          @add="openLine('deduction')" @edit="openLine('deduction', $event)" @rename="openRename" @remove="removing = $event" @edit-rate="rateSheet = true"
        />
        <PlanSection title="Fixed costs" :items="ofKind('fixed')" :total="sectionTotal('fixed')" @add="openLine('fixed')" @edit="openLine('fixed', $event)" @rename="openRename" @remove="removing = $event" />
      </div>

      <div class="flex flex-col gap-8 lg:col-span-5">
        <section aria-label="Month summary">
          <h2 class="t-heading mb-3">Summary</h2>
          <dl class="divide-y divide-line border-y border-line">
            <div class="flex justify-between py-3"><dt class="text-muted-foreground">Gross income</dt><dd class="font-medium">{{ formatMoney(summary.gross) }}</dd></div>
            <div class="flex justify-between py-3"><dt class="text-muted-foreground">Deductions</dt><dd class="font-medium">{{ formatMoney(summary.deductions) }}</dd></div>
            <div class="flex justify-between py-3"><dt class="text-muted-foreground">Net income</dt><dd class="font-medium">{{ formatMoney(summary.net) }}</dd></div>
            <div class="flex justify-between py-3"><dt class="text-muted-foreground">Fixed costs</dt><dd class="font-medium">{{ formatMoney(summary.fixed) }}</dd></div>
            <div class="flex justify-between py-3"><dt class="font-medium">Available for spending</dt><dd class="font-semibold">{{ formatMoney(summary.afterFixed) }}</dd></div>
          </dl>
        </section>
      </div>
    </div>

    <ResponsiveSheet v-model:open="lineSheet.open" :title="lineSheet.item ? lineSheet.item.label : 'Add line'">
      <PlanLineForm v-if="lineSheet.open" :item="lineSheet.item" :on-save="saveLine" />
    </ResponsiveSheet>
    <ResponsiveSheet v-model:open="renameSheet.open" title="Rename line">
      <NameForm v-if="renameSheet.open" label="Name" :initial="renameSheet.item?.label" submit-label="Save changes" :max="60" :on-save="saveRename" />
    </ResponsiveSheet>
    <ResponsiveSheet v-model:open="rateSheet" title="EPF rate">
      <RateForm v-if="rateSheet && data" :rate="epfRate" :on-save="saveRate" />
    </ResponsiveSheet>
    <ConfirmDialog
      v-model:open="removeOpen"
      title="Delete this line?"
      :description="removing ? `${removing.label} will end from ${formatMonth(month)}. Earlier months keep it.` : ''"
      confirm-label="Delete line"
      @confirm="confirmRemove"
    />
  </div>
</template>
