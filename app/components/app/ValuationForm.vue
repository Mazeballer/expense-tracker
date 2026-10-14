<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { nonNegativeAmount } from '~/lib/expenseSchema'
import { todayKL } from '~/lib/date'
import type { Account, ValuationInput } from '~/types'

const props = defineProps<{ onSave: (input: ValuationInput) => Promise<void>; accounts: Account[]; defaultAccountId?: string }>()
const online = useOnline()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(z.object({
    accountId: z.string().min(1, 'Choose an account'),
    value: nonNegativeAmount,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  })),
  initialValues: { accountId: props.defaultAccountId ?? props.accounts[0]?.id ?? '', value: '', date: todayKL() },
})
const submit = handleSubmit(async (v) => { await props.onSave({ accountId: v.accountId, value: Number(v.value), asOf: v.date }) })
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-slot="{ value, handleChange }" name="accountId">
      <FormItem>
        <FormLabel>Account</FormLabel>
        <Select :model-value="value" @update:model-value="handleChange">
          <SelectTrigger class="h-11 w-full"><SelectValue placeholder="Choose an account" /></SelectTrigger>
          <SelectContent><SelectItem v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</SelectItem></SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="value">
      <FormItem>
        <FormLabel>Current value</FormLabel>
        <MoneyInput :model-value="value" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="date">
      <FormItem>
        <FormLabel>As of</FormLabel>
        <DatePicker :model-value="value" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit" class="h-11" :disabled="isSubmitting || !online">Update value</Button>
  </form>
</template>
