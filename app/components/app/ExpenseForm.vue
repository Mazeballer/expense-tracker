<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { expenseSchema } from '~/lib/expenseSchema'
import { klDate, nowKLIso, todayKL, toKLIso } from '~/lib/date'
import { cn } from '@/lib/utils'
import type { Expense } from '~/types'

const props = defineProps<{ expense: Expense }>()
const emit = defineEmits<{ saved: []; remove: [] }>()

const { categories, paymentMethods } = useLookups()
const { update } = useExpenses()
const online = useOnline()
const lastMethod = useLocalStorage<string>('last-payment-method', '')

const visibleCategories = computed(() =>
  categories.value.filter((c) => !c.archived || c.id === props.expense?.categoryId))
const visibleMethods = computed(() =>
  paymentMethods.value.filter((m) => !m.archived || m.id === props.expense?.paymentMethodId))

const defaultMethod = computed(() => {
  const usable = visibleMethods.value
  return usable.find((m) => m.id === lastMethod.value)?.id ?? usable[0]?.id ?? null
})

const { handleSubmit, values, isSubmitting } = useForm({
  validationSchema: toTypedSchema(expenseSchema),
  initialValues: {
    amount: props.expense.amount.toFixed(2),
    categoryId: props.expense.categoryId,
    paymentMethodId: props.expense.paymentMethodId,
    description: props.expense.description,
    date: klDate(props.expense.spentAt),
    note: props.expense.note ?? '',
  },
})

const largeAmount = computed(() => Number(values.amount) >= 1000)

const save = handleSubmit(async (v) => {
  const sameDay = klDate(props.expense.spentAt) === v.date
  const spentAt = sameDay ? props.expense.spentAt : v.date === todayKL() ? nowKLIso() : toKLIso(v.date)
  try {
    await update(props.expense.id, {
      spentAt,
      description: v.description,
      categoryId: v.categoryId,
      paymentMethodId: v.paymentMethodId,
      amount: Number(v.amount),
      note: v.note.trim() || null,
      source: props.expense.source,
    })
    if (v.paymentMethodId) lastMethod.value = v.paymentMethodId
    toast.success('Changes saved')
    bumpData()
    emit('saved')
  } catch {
    toast.error('Could not save. Your changes are still here. Try again.')
  }
})

onMounted(() => setTimeout(() => document.getElementById('expense-amount')?.focus(), 200))
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="save">
    <FormField v-slot="{ componentField }" name="amount">
      <FormItem>
        <FormLabel>Amount</FormLabel>
        <FormControl>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RM</span>
            <Input
              id="expense-amount"
              v-bind="componentField"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0.00"
              :class="cn('h-11 pl-12 text-right', largeAmount && 'border-2 border-brand')"
            />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value, handleChange }" name="categoryId">
      <FormItem>
        <FormLabel>Category</FormLabel>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
          <button
            v-for="c in visibleCategories"
            :key="c.id"
            type="button"
            role="radio"
            :aria-checked="value === c.id"
            :class="cn('h-11 rounded-full border px-4', value === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-ink')"
            @click="handleChange(c.id)"
          >
            {{ c.name }}
          </button>
        </div>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value, handleChange }" name="paymentMethodId">
      <FormItem>
        <FormLabel>Payment method</FormLabel>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
          <button
            v-for="m in visibleMethods"
            :key="m.id"
            type="button"
            role="radio"
            :aria-checked="value === m.id"
            :class="cn('h-11 rounded-full border px-4', value === m.id ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-ink')"
            @click="handleChange(m.id)"
          >
            {{ m.name }}
          </button>
        </div>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl><Input v-bind="componentField" class="h-11" autocomplete="off" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value, handleChange }" name="date">
      <FormItem>
        <FormLabel>Date</FormLabel>
        <DatePicker :model-value="value" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="note">
      <FormItem>
        <FormLabel>Note (optional)</FormLabel>
        <FormControl><Input v-bind="componentField" class="h-11" autocomplete="off" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit" class="h-11" :disabled="isSubmitting || !online">
      Save changes
    </Button>
    <Button v-if="expense" type="button" variant="ghost" class="h-11 text-alert hover:text-alert" :disabled="!online" @click="emit('remove')">
      Delete expense
    </Button>
  </form>
</template>
