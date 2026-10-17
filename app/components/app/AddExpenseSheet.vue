<script setup lang="ts">
import type { Expense } from '~/types'
const { open, editing } = useAddSheet()
const picked = usePickedMethod()
const deleteExpense = useDeleteExpense()
const toDelete = ref<Expense | null>(null)
async function confirmDelete(e: Expense) {
  toDelete.value = null
  if (await deleteExpense(e)) open.value = false
}
const mode = ref<'text' | 'receipt'>('text')
const photo = ref<File | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  mode.value = 'text'
  photo.value = null
  picked.value = null
})

const title = computed(() => (editing.value ? 'Edit expense' : mode.value === 'receipt' ? 'Receipt' : 'Add expense'))

function toReceipt(file: File) {
  photo.value = file
  mode.value = 'receipt'
}

const lock = useAppLock()

function retake() {
  lock.grace()
  photoInput.value?.click()
}

function onRetake(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    photo.value = null
    nextTick(() => toReceipt(file))
  }
}
</script>

<template>
  <ResponsiveSheet v-model:open="open" :title="title">
    <template v-if="!editing" #title-end><MethodMenu /></template>
    <template v-if="open">
      <ExpenseForm v-if="editing" :key="editing.id" :expense="editing" @saved="open = false" @remove="toDelete = editing" />
      <QuickLog v-else-if="mode === 'text'" @done="open = false" @receipt="toReceipt" />
      <template v-else-if="photo">
        <ReceiptReview :key="photo.name + photo.lastModified + photo.size" :photo="photo" @done="open = false" @retake="retake" @type-it="mode = 'text'" />
        <input ref="photoInput" type="file" accept="image/*" capture="environment" class="sr-only" tabindex="-1" aria-label="Receipt photo" @change="onRetake">
      </template>
    </template>
  </ResponsiveSheet>
  <DeleteExpenseDialog v-model="toDelete" @confirm="confirmDelete" />
</template>
