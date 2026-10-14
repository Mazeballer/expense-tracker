<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { positiveAmount } from '~/lib/expenseSchema'
import { cn } from '@/lib/utils'
import type { Budget } from '~/types'

const props = defineProps<{
  budget: Budget | null
  targets: { id: string | null; name: string }[]
  initialTarget?: string | null
  onSave: (v: { categoryId: string | null; amount: number }) => Promise<void>
  onRemove: () => Promise<void>
}>()
const online = useOnline()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(z.object({ amount: positiveAmount })),
  initialValues: { amount: props.budget ? props.budget.amount.toFixed(2) : '' },
})
const target = ref<string | null>(props.budget ? props.budget.categoryId : (props.initialTarget ?? props.targets[0]?.id ?? null))
const removing = ref(false)
const submit = handleSubmit(async (v) => { await props.onSave({ categoryId: target.value, amount: Number(v.amount) }) })
async function remove() {
  removing.value = true
  await props.onRemove()
  removing.value = false
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <div v-if="!budget && targets.length > 1" class="flex flex-col gap-2">
      <span class="t-secondary font-medium">What is this budget for?</span>
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Budget for">
        <button
          v-for="t in targets"
          :key="t.id ?? 'overall'"
          type="button"
          role="radio"
          :aria-checked="target === t.id"
          :class="cn('h-11 rounded-full border px-4', target === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-ink')"
          @click="target = t.id"
        >{{ t.name }}</button>
      </div>
    </div>
    <FormField v-slot="{ value, handleChange }" name="amount">
      <FormItem>
        <FormLabel>Amount per month</FormLabel>
        <MoneyInput :model-value="value" @update:model-value="handleChange" />
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit" class="h-12" :disabled="isSubmitting || removing || !online">Save budget</Button>
    <Button v-if="budget" type="button" variant="outline" class="h-11 text-alert" :disabled="removing || !online" @click="remove">Remove budget</Button>
  </form>
</template>
