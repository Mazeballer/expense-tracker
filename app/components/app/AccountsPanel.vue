<script setup lang="ts">
import { PhDotsThree, PhPencilSimple, PhTrash, PhTrendUp } from '@phosphor-icons/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatShortDate } from '~/lib/date'
import { accountFigures } from '~/lib/finance'
import { ACCOUNT_ICONS } from '~/lib/emoji'
import { formatMoney, formatPercent } from '~/lib/format'
import type { Account, AccountKind, AccountTx, Valuation } from '~/types'

const props = defineProps<{ kind: AccountKind; accounts: Account[]; txs: AccountTx[]; vals: Valuation[] }>()
const api = useAccounts()
const isDesktop = useIsDesktop()
const investment = computed(() => props.kind === 'investment')

const rows = computed(() => props.accounts.map((a) => ({
  account: a,
  ...accountFigures(props.txs.filter((t) => t.accountId === a.id), props.vals.filter((v) => v.accountId === a.id)),
  points: props.vals.filter((v) => v.accountId === a.id),
})))

const removedTx = ref<string[]>([])
const log = computed(() => props.txs.filter((t) => !removedTx.value.includes(t.id)))
const accountName = (id: string) => props.accounts.find((a) => a.id === id)?.name ?? ''

const txSheet = reactive({ open: false, tx: null as AccountTx | null, accountId: undefined as string | undefined })
const valSheet = reactive({ open: false, accountId: undefined as string | undefined })
const nameSheet = reactive({ open: false, account: null as Account | null })
const deleting = ref<AccountTx | null>(null)
const confirmOpen = computed({ get: () => deleting.value !== null, set: (v) => { if (!v) deleting.value = null } })

const openTx = (tx: AccountTx | null = null, accountId?: string) => Object.assign(txSheet, { open: true, tx, accountId })
const openVal = (accountId?: string) => Object.assign(valSheet, { open: true, accountId })
const openName = (account: Account | null = null) => Object.assign(nameSheet, { open: true, account })

async function saveTx(input: Omit<AccountTx, 'id'>) {
  const editing = txSheet.tx
  if (await runSave(() => (editing ? api.updateTransaction(editing.id, input) : api.addTransaction(input)), editing ? 'Changes saved' : 'Deposit added')) txSheet.open = false
}

async function saveValue(input: Omit<Valuation, 'id'>) {
  const existing = props.vals.find((v) => v.accountId === input.accountId && v.asOf === input.asOf)
  if (await runSave(() => (existing ? api.updateValuation(existing.id, input) : api.addValuation(input)), 'Value updated')) valSheet.open = false
}

async function saveName(name: string, _kind?: string, icon?: string) {
  const account = nameSheet.account
  const chosen = icon ?? ACCOUNT_ICONS[0]!
  if (await runSave(() => (account ? api.updateAccount(account.id, { name, icon: chosen }) : api.addAccount({ name, kind: props.kind, icon: chosen })), account ? 'Changes saved' : 'Account added')) nameSheet.open = false
}

const archive = (a: Account) => runSave(() => api.updateAccount(a.id, { archived: true }), 'Account archived')

async function removeTx() {
  const tx = deleting.value
  if (!tx) return
  deleting.value = null
  removedTx.value.push(tx.id)
  try {
    await api.removeTransaction(tx.id)
    toast.success('Deposit deleted')
    bumpData()
  } catch {
    toast.error('Could not delete. Try again.')
  } finally {
    removedTx.value = removedTx.value.filter((id) => id !== tx.id)
  }
}

defineExpose({ openTx, openVal, openName, hasAccounts: computed(() => props.accounts.length > 0) })

const gainText = (g: number, contributed: number) =>
  `${g >= 0 ? '+' : '-'}${formatMoney(Math.abs(g))}${contributed > 0 ? ` (${formatPercent(Math.abs(g) / contributed)})` : ''}`
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <section aria-label="Accounts">
        <h2 class="t-heading mb-3">Accounts</h2>
        <EmptyState v-if="!accounts.length" message="No accounts yet. Add one to start." action="Add account" @action="openName()" />
        <Table v-else-if="isDesktop">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead class="text-right">Contributed</TableHead>
              <TableHead class="text-right">{{ investment ? 'Current value' : 'Balance' }}</TableHead>
              <TableHead v-if="investment" class="text-right">Gain</TableHead>
              <TableHead class="w-12"><span class="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.account.id">
              <TableCell class="font-medium"><span class="mr-2" aria-hidden="true">{{ r.account.icon }}</span>{{ r.account.name }}</TableCell>
              <TableCell class="text-right">{{ formatMoney(r.contributed) }}</TableCell>
              <TableCell class="text-right font-medium">{{ formatMoney(r.value) }}</TableCell>
              <TableCell v-if="investment" class="text-right text-muted-foreground">{{ r.hasValuation ? gainText(r.gain, r.contributed) : 'No value yet' }}</TableCell>
              <TableCell>
                <AccountMenu :investment="investment" :name="r.account.name" @value="openVal(r.account.id)" @rename="openName(r.account)" @archive="archive(r.account)" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ul v-else class="border-t border-line">
          <li v-for="r in rows" :key="r.account.id" class="flex min-h-14 items-center gap-3 border-b border-line py-1">
            <IconBubble :icon="r.account.icon" />
            <div class="min-w-0 flex-1 py-2">
              <span class="block truncate font-medium">{{ r.account.name }}</span>
              <span class="t-caption text-muted-foreground">Contributed {{ formatMoney(r.contributed) }}</span>
            </div>
            <div class="text-right">
              <span class="block font-medium">{{ formatMoney(r.value) }}</span>
              <span v-if="investment && r.hasValuation" class="t-caption text-muted-foreground">{{ gainText(r.gain, r.contributed) }}</span>
            </div>
            <AccountMenu :investment="investment" :name="r.account.name" @value="openVal(r.account.id)" @rename="openName(r.account)" @archive="archive(r.account)" />
          </li>
        </ul>

        <div v-if="investment" class="mt-8 flex flex-col gap-8">
          <section v-for="r in rows.filter((x) => x.points.length >= 2)" :key="r.account.id" :aria-label="`${r.account.name} value`">
            <h3 class="mb-3 font-medium">{{ r.account.name }}</h3>
            <LazyValueChart :points="r.points" :name="r.account.name" />
          </section>
        </div>
      </section>

      <section aria-label="Log">
        <h2 class="t-heading mb-3">Log</h2>
        <EmptyState v-if="!log.length" message="No deposits yet. Add one to start." :action="accounts.length ? 'Add deposit' : undefined" @action="openTx()" />
        <ul v-else class="border-t border-line">
          <li v-for="t in log" :key="t.id" class="flex min-h-14 items-center gap-2 border-b border-line">
            <button type="button" class="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left" @click="openTx(t)">
              <IconBubble :icon="t.type === 'deposit' ? '💰' : '💸'" />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ t.note || (t.type === 'deposit' ? 'Deposit' : 'Withdrawal') }}</span>
                <span class="t-caption text-muted-foreground">{{ accountName(t.accountId) }} on {{ formatShortDate(t.occurredOn) }}</span>
              </span>
              <span class="font-medium">{{ t.type === 'deposit' ? '+' : '-' }}{{ formatMoney(t.amount) }}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="size-11 shrink-0" aria-label="Actions for this entry"><PhDotsThree :size="20" weight="bold" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem class="gap-3" @select="openTx(t)"><PhPencilSimple :size="20" />Edit entry</DropdownMenuItem>
                <DropdownMenuItem class="gap-3 text-alert focus:text-alert" @select="deleting = t"><PhTrash :size="20" />Delete entry</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </section>
    </div>

    <ResponsiveSheet v-model:open="txSheet.open" :title="txSheet.tx ? 'Edit entry' : 'Add deposit'">
      <AccountTxForm v-if="txSheet.open" :accounts="accounts" :tx="txSheet.tx" :default-account-id="txSheet.accountId" :on-save="saveTx" />
    </ResponsiveSheet>
    <ResponsiveSheet v-model:open="valSheet.open" title="Update value">
      <ValuationForm v-if="valSheet.open" :accounts="accounts" :default-account-id="valSheet.accountId" :on-save="saveValue" />
    </ResponsiveSheet>
    <ResponsiveSheet v-model:open="nameSheet.open" :title="nameSheet.account ? 'Rename account' : 'Add account'">
      <NameForm v-if="nameSheet.open" label="Name" :icons="ACCOUNT_ICONS" :initial-icon="nameSheet.account?.icon" :initial="nameSheet.account?.name" :submit-label="nameSheet.account ? 'Save changes' : 'Add account'" :max="60" :on-save="saveName" />
    </ResponsiveSheet>
    <ConfirmDialog v-model:open="confirmOpen" title="Delete this entry?" :description="deleting ? `${formatMoney(deleting.amount)} on ${formatShortDate(deleting.occurredOn)} will be removed.` : ''" confirm-label="Delete entry" @confirm="removeTx" />
  </div>
</template>
