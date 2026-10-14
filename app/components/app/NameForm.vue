<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const props = defineProps<{ onSave: (name: string, kind?: string, icon?: string) => Promise<void>; kinds?: { value: string; label: string }[]; icons?: string[]; initialIcon?: string; label: string; initial?: string; submitLabel: string; max?: number }>()
const online = useOnline()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(z.object({
    name: z.string().trim().min(1, `Enter a ${props.label.toLowerCase()}`).max(props.max ?? 40, `Use ${props.max ?? 40} characters or fewer`),
  })),
  initialValues: { name: props.initial ?? '' },
})
const kind = ref(props.kinds?.[0]?.value)
const icon = ref(props.initialIcon ?? props.icons?.[0])
onMounted(() => setTimeout(() => document.getElementById('name-field')?.focus(), 350))
const submit = handleSubmit(async (v) => { await props.onSave(v.name, kind.value, icon.value) })
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormField v-slot="{ componentField }" name="name" :validate-on-blur="false">
      <FormItem>
        <FormLabel>{{ label }}</FormLabel>
        <FormControl><Input id="name-field" v-bind="componentField" class="h-11" autocomplete="off" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <div v-if="icons" class="flex flex-col gap-2">
      <span class="t-secondary font-medium" id="icon-label">Icon</span>
      <div class="grid grid-cols-6 gap-2" role="radiogroup" aria-labelledby="icon-label">
        <button
          v-for="i in icons"
          :key="i"
          type="button"
          role="radio"
          :aria-checked="icon === i"
          :aria-label="`Icon ${i}`"
          :class="cn('flex size-11 items-center justify-center rounded-full border text-xl', icon === i ? 'border-primary bg-brand/10' : 'border-line bg-surface')"
          @click="icon = i"
        >{{ i }}</button>
      </div>
    </div>
    <div v-if="kinds" class="flex flex-col gap-2">
      <span class="t-secondary font-medium">Type</span>
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Type">
        <button
          v-for="k in kinds"
          :key="k.value"
          type="button"
          role="radio"
          :aria-checked="kind === k.value"
          :class="cn('h-11 rounded-full border px-4', kind === k.value ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface text-ink')"
          @click="kind = k.value"
        >{{ k.label }}</button>
      </div>
    </div>
    <Button type="submit" class="h-11" :disabled="isSubmitting || !online">{{ submitLabel }}</Button>
  </form>
</template>
