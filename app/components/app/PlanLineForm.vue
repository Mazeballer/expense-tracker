<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { nonNegativeAmount } from '~/lib/expenseSchema'
import { formatMonth } from '~/lib/date'
import type { PlanItem } from '~/types'

const props = defineProps<{
  onSave: (v: { label: string; amount: number; fromMonth: string }) => Promise<void>
  item: PlanItem | null
}>()
const online = useOnline()
const appliesFrom = useAppliesFrom()

const { handleSubmit, isSubmitting, values } = useForm({
  validationSchema: toTypedSchema(z.object({
    label: z.string().trim().min(1, 'Enter a name').max(60, 'Use 60 characters or fewer'),
    amount: nonNegativeAmount,
    fromMonth: z.string().min(1),
  })),
  initialValues: { label: props.item?.label ?? '', amount: props.item ? props.item.amount.toFixed(2) : '', fromMonth: appliesFrom.initial() },
})
const submit = handleSubmit(async (v) => {
  appliesFrom.remember(v.fromMonth)
  await props.onSave({ label: v.label, amount: Number(v.amount), fromMonth: v.fromMonth })
})
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-if="!item" v-slot="{ componentField }" name="label">
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl><Input v-bind="componentField" class="h-11" autocomplete="off" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="amount">
      <FormItem>
        <FormLabel>Amount per month</FormLabel>
        <MoneyInput :model-value="value" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="fromMonth">
      <FormItem>
        <FormLabel>Applies from</FormLabel>
        <MonthSelect :model-value="value" @update:model-value="handleChange" />
        <p class="t-secondary text-muted-foreground">Applies from {{ formatMonth(String(values.fromMonth)) }}. Earlier months keep their amounts.</p>
      </FormItem>
    </FormField>
    <Button type="submit" class="h-11" :disabled="isSubmitting || !online">{{ item ? 'Save changes' : 'Add line' }}</Button>
  </form>
</template>
