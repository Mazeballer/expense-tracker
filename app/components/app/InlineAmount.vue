<script setup lang="ts">
import { toast } from 'vue-sonner'
import { formatMoney, round2 } from '~/lib/format'
import type { Expense } from '~/types'

// Tap the amount to change just the amount, without opening the whole edit sheet.
const props = defineProps<{ expense: Expense }>()
const { update } = useExpenses()

const editing = ref(false)
const text = ref('')
const saving = ref(false)
const field = ref<HTMLInputElement | null>(null)
let cancelled = false

async function start() {
  cancelled = false
  text.value = props.expense.amount.toFixed(2)
  editing.value = true
  await nextTick()
  field.value?.focus()
  field.value?.select()
}

async function commit() {
  if (!editing.value || saving.value) return
  if (cancelled) { editing.value = false; return }
  const value = round2(Number(text.value.replace(',', '.')))
  if (value === props.expense.amount) { editing.value = false; return }
  if (!Number.isFinite(value) || value <= 0 || value >= 1_000_000) {
    toast.error('Enter an amount above 0.')
    field.value?.focus()
    return
  }
  saving.value = true
  try {
    const { id, ...rest } = props.expense
    await update(id, { ...rest, amount: value })
    editing.value = false
    toast.success('Amount updated')
    bumpData()
  } catch {
    toast.error('Could not save. Try again.')
    field.value?.focus()
  } finally {
    saving.value = false
  }
}

function cancel() {
  cancelled = true
  field.value?.blur()
}
</script>

<template>
  <div class="relative shrink-0">
    <input
      v-if="editing"
      ref="field"
      v-model="text"
      inputmode="decimal"
      autocomplete="off"
      enterkeyhint="done"
      aria-label="Amount in RM"
      :disabled="saving"
      class="h-10 w-28 rounded-lg border-2 border-brand bg-background px-2 text-right font-medium outline-none"
      @blur="commit"
      @keydown.enter.prevent="field?.blur()"
      @keydown.esc.prevent="cancel"
    >
    <button
      v-else
      type="button"
      class="flex h-10 min-w-11 items-center justify-end rounded-lg px-2 font-medium active:bg-muted"
      aria-label="Change amount"
      @click="start"
    >
      {{ formatMoney(expense.amount) }}
    </button>
  </div>
</template>
