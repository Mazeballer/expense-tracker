<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatMonth } from '~/lib/date'

const props = defineProps<{ rate: number; onSave: (v: { rate: number; fromMonth: string }) => Promise<void> }>()
const online = useOnline()
const appliesFrom = useAppliesFrom()

const { handleSubmit, isSubmitting, values } = useForm({
  validationSchema: toTypedSchema(z.object({
    percent: z.string().trim().refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 100, 'Enter a rate from 0 to 100'),
    fromMonth: z.string().min(1),
  })),
  initialValues: { percent: String(Math.round(props.rate * 10000) / 100), fromMonth: appliesFrom.initial() },
})
const submit = handleSubmit(async (v) => {
  appliesFrom.remember(v.fromMonth)
  await props.onSave({ rate: Number(v.percent) / 100, fromMonth: v.fromMonth })
})
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-slot="{ componentField }" name="percent" :validate-on-blur="false">
      <FormItem>
        <FormLabel>EPF rate (%)</FormLabel>
        <FormControl><Input v-bind="componentField" inputmode="decimal" class="h-11" autocomplete="off" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ value, handleChange }" name="fromMonth">
      <FormItem>
        <FormLabel>Applies from</FormLabel>
        <MonthSelect :model-value="value" @update:model-value="handleChange" />
        <p class="t-secondary text-muted-foreground">Applies from {{ formatMonth(String(values.fromMonth)) }}. Earlier months keep their rate.</p>
      </FormItem>
    </FormField>
    <Button type="submit" class="h-12" :disabled="isSubmitting || !online">Save changes</Button>
  </form>
</template>
