<script setup lang="ts">
import { PhBank, PhCoins, PhHandCoins, PhTrendUp } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { savingsTotals } from '~/lib/finance'
import { formatMoney, formatPercent } from '~/lib/format'

type Panel = { openTx: () => void; openVal: () => void; openName: () => void; hasAccounts: boolean }
const tab = ref<'savings' | 'investments'>('savings')
const savingsPanel = ref<Panel | null>(null)
const investPanel = ref<Panel | null>(null)
const panel = computed(() => (tab.value === 'savings' ? savingsPanel.value : investPanel.value))

const loadSavings = useSavingsData()
const { data, loading, error, reload } = useResource(loadSavings)

const totals = computed(() => data.value ? savingsTotals(data.value.accounts, data.value.txs, data.value.vals, data.value.settings.savingsGoal) : null)
const ofKind = (kind: 'savings' | 'investment') => {
  const accounts = (data.value?.accounts ?? []).filter((a) => a.kind === kind)
  const ids = new Set(accounts.map((a) => a.id))
  return { accounts, txs: (data.value?.txs ?? []).filter((t) => ids.has(t.accountId)), vals: (data.value?.vals ?? []).filter((v) => ids.has(v.accountId)) }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between gap-3">
      <PageTitle>Savings</PageTitle>
      <DropdownMenu v-if="data">
        <DropdownMenuTrigger as-child>
          <Button variant="secondary" size="icon" class="size-11 shrink-0" aria-label="Savings actions"><PhHandCoins :size="24" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-48">
          <DropdownMenuItem class="min-h-12 gap-3 text-base" :disabled="!panel?.hasAccounts" @select="panel?.openTx()"><PhCoins :size="22" />Add Deposit</DropdownMenuItem>
          <template v-if="tab === 'investments'">
            <DropdownMenuSeparator />
            <DropdownMenuItem class="min-h-12 gap-3 text-base" :disabled="!panel?.hasAccounts" @select="panel?.openVal()"><PhTrendUp :size="22" />Update Value</DropdownMenuItem>
          </template>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="min-h-12 gap-3 text-base" @select="panel?.openName()"><PhBank :size="22" />Add Account</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="loading" class="flex flex-col gap-8" aria-hidden="true">
      <div class="flex flex-col gap-3"><Skeleton class="h-10 w-48" /><Skeleton class="h-1 w-full" /><Skeleton class="h-4 w-40" /></div>
      <Skeleton class="h-11 w-full" />
      <ExpenseListSkeleton :rows="4" />
    </div>
    <ErrorState v-else-if="error || !data || !totals" what="savings" @retry="reload" />
    <template v-else>
      <section aria-label="Savings goal" class="flex flex-col gap-3">
        <div>
          <p class="text-muted-foreground">Total saved</p>
          <p class="t-title">{{ formatMoney(totals.total) }}</p>
        </div>
        <template v-if="totals.goal && totals.progress !== null">
          <div class="h-1 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Progress to savings goal" :aria-valuenow="Math.round(totals.progress * 100)" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full bg-brand" :style="{ width: `${totals.progress * 100}%` }" />
          </div>
          <p class="t-secondary text-muted-foreground">{{ formatPercent(totals.progress) }} of {{ formatMoney(totals.goal) }}, {{ formatMoney(totals.remaining ?? 0) }} to go</p>
        </template>
      </section>

      <Tabs v-model="tab">
        <TabsList class="grid h-11 w-full grid-cols-2 lg:w-80">
          <TabsTrigger value="savings" class="h-9">Savings</TabsTrigger>
          <TabsTrigger value="investments" class="h-9">Investments</TabsTrigger>
        </TabsList>
        <TabsContent value="savings" class="pt-4"><AccountsPanel ref="savingsPanel" kind="savings" v-bind="ofKind('savings')" /></TabsContent>
        <TabsContent value="investments" class="pt-4"><AccountsPanel ref="investPanel" kind="investment" v-bind="ofKind('investment')" /></TabsContent>
      </Tabs>
    </template>
  </div>
</template>
