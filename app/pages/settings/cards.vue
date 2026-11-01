<script setup lang="ts">
import { PhCaretRight } from '@phosphor-icons/vue'
import type { PaymentMethodKind } from '~/types'

const lookups = useLookups()
const sheet = reactive({ open: false, kind: 'debit' as PaymentMethodKind })

const sections: { kind: PaymentMethodKind; title: string }[] = [
  { kind: 'debit', title: 'Debit' },
  { kind: 'credit_card', title: 'Credit' },
]
const methodOf = (kind: PaymentMethodKind) => lookups.paymentMethods.value.find((m) => m.kind === kind && !m.archived)
const namesOf = (kind: PaymentMethodKind) => methodOf(kind)?.walletNames ?? []
const otherKind = (kind: PaymentMethodKind): PaymentMethodKind => (kind === 'debit' ? 'credit_card' : 'debit')
const titleOf = (kind: PaymentMethodKind) => sections.find((s) => s.kind === kind)!.title
const openSheet = (kind: PaymentMethodKind) => Object.assign(sheet, { open: true, kind })

async function save(names: string[]) {
  const kind = sheet.kind
  const method = methodOf(kind)
  const ok = await runSave(
    () => (method ? lookups.updatePaymentMethod(method.id, { walletNames: names }) : lookups.addPaymentMethod(kind === 'debit' ? 'Debit card' : 'Credit card', kind, names)),
    'Changes saved',
  )
  if (ok) sheet.open = false
}
</script>

<template>
  <div class="flex max-w-xl flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Cards</PageTitle>
      <p class="t-secondary mt-1 text-muted-foreground">For Apple Pay auto-log. Add the names of your cards as Apple Wallet shows them, under debit or credit, so each payment is logged the right way. A card that is not in either list is logged as credit if its name has the word credit in it, otherwise as debit.</p>
    </div>

    <ul class="border-t border-line">
      <li v-for="s in sections" :key="s.kind" class="border-b border-line">
        <button type="button" class="flex min-h-16 w-full items-center gap-3 py-2 text-left" @click="openSheet(s.kind)">
          <span class="min-w-0 flex-1">
            <span class="block">{{ s.title }}</span>
            <span class="t-caption block truncate text-muted-foreground">{{ namesOf(s.kind).length ? namesOf(s.kind).join(', ') : 'No cards yet' }}</span>
          </span>
          <span class="t-secondary text-muted-foreground">{{ namesOf(s.kind).length }}</span>
          <PhCaretRight :size="18" class="shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <ResponsiveSheet v-model:open="sheet.open" :title="`${titleOf(sheet.kind)} cards`">
      <CardNamesForm v-if="sheet.open" :names="namesOf(sheet.kind)" :other-names="namesOf(otherKind(sheet.kind))" :on-save="save" />
    </ResponsiveSheet>
  </div>
</template>
