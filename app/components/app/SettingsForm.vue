<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { nonNegativeAmount } from '~/lib/expenseSchema'
import type { Settings } from '~/types'

const props = defineProps<{ settings: Settings; onSave: (s: { savingsGoal: number | null }) => Promise<void> }>()
const online = useOnline()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(z.object({ goal: z.union([z.literal(''), nonNegativeAmount]) })),
  initialValues: { goal: props.settings.savingsGoal === null ? '' : props.settings.savingsGoal.toFixed(2) },
})
const submit = handleSubmit(async (v) => { await props.onSave({ savingsGoal: v.goal === '' ? null : Number(v.goal) }) })
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-slot="{ value, handleChange }" name="goal">
      <FormItem>
        <FormLabel>Savings goal</FormLabel>
        <MoneyInput :model-value="value" placeholder="No goal" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit" class="h-12" :disabled="isSubmitting || !online">Save changes</Button>
  </form>
</template>
