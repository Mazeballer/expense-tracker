<script setup lang="ts">
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatShortDate, klDate } from '~/lib/date'
import { formatMoney } from '~/lib/format'
import type { Expense } from '~/types'

const expense = defineModel<Expense | null>({ required: true })
defineEmits<{ confirm: [expense: Expense] }>()
const kept = ref<Expense | null>(null)
watch(expense, (e) => { if (e) kept.value = e })
</script>

<template>
  <AlertDialog :open="expense !== null" @update:open="(o) => { if (!o) expense = null }">
    <AlertDialogContent class="rounded-2xl bg-surface">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
        <AlertDialogDescription v-if="kept">
          {{ kept.description }}, {{ formatMoney(kept.amount) }} on {{ formatShortDate(klDate(kept.spentAt)) }} will be removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel class="h-11">Cancel</AlertDialogCancel>
        <AlertDialogAction class="h-11 bg-alert text-ground hover:bg-alert/90" @click="expense && $emit('confirm', expense)">Delete expense</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
