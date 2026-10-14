<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { positiveAmount } from '~/lib/expenseSchema'
import { todayKL } from '~/lib/date'
import type { Account, AccountTx, AccountTxInput } from '~/types'

const props = defineProps<{ onSave: (input: AccountTxInput) => Promise<void>; accounts: Account[]; tx: AccountTx | null; defaultAccountId?: string }>()
const online = useOnline()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(z.object({
    accountId: z.string().min(1, 'Choose an account'),
    type: z.enum(['deposit', 'withdrawal']),
    amount: positiveAmount,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
    note: z.string().max(200, 'Use 200 characters or fewer'),
  })),
  initialValues: {
    accountId: props.tx?.accountId ?? props.defaultAccountId ?? props.accounts[0]?.id ?? '',
    type: props.tx?.type ?? 'deposit',
    amount: props.tx ? props.tx.amount.toFixed(2) : '',
    date: props.tx?.occurredOn ?? todayKL(),
    note: props.tx?.note ?? '',
  },
})

const submit = handleSubmit(async (v) => {
  await props.onSave({ accountId: v.accountId, type: v.type, amount: Number(v.amount), occurredOn: v.date, note: v.note.trim() || null })
})
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-slot="{ value, handleChange }" name="type">
      <FormItem>
        <FormLabel>Type</FormLabel>
        <div class="flex gap-2" role="radiogroup" aria-label="Type">
          <button
            v-for="t in [{ v: 'deposit', l: 'Deposit' }, { v: 'withdrawal', l: 'Withdrawal' }]"
            :key="t.v"
            type="button"
            role="radio"
            :aria-checked="value === t.v"
            :class="cn('h-11 rounded-full border px-4', value === t.v ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-ink')"
            @click="handleChange(t.v)"
          >{{ t.l }}</button>
        </div>
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="accountId">
      <FormItem>
        <FormLabel>Account</FormLabel>
        <Select :model-value="value" @update:model-value="handleChange">
          <FormControl><SelectTrigger class="h-11 w-full"><SelectValue placeholder="Choose an account" /></SelectTrigger></FormControl>
          <SelectContent><SelectItem v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</SelectItem></SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="amount">
      <FormItem>
        <FormLabel>Amount</FormLabel>
        <MoneyInput :model-value="value" @update:model-value="handleChange" />
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
    <Button type="submit" class="h-11" :disabled="isSubmitting || !online">{{ tx ? 'Save changes' : 'Add deposit' }}</Button>
  </form>
</template>
