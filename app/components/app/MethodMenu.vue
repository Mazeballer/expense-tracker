<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const picked = usePickedMethod()
const lastMethod = useLocalStorage<string>('last-payment-method', '')
const { paymentMethods } = useLookups()

const usable = computed(() => paymentMethods.value.filter((m) => !m.archived))
const current = computed(() => usable.value.find((m) => m.id === (picked.value ?? lastMethod.value))?.id ?? usable.value[0]?.id)
</script>

<template>
  <Select v-if="current" :model-value="current" @update:model-value="(v) => (picked = String(v))">
    <SelectTrigger class="h-9 w-auto gap-2 rounded-full px-3" aria-label="Payment method"><SelectValue /></SelectTrigger>
    <SelectContent align="end">
      <SelectItem v-for="m in usable" :key="m.id" :value="m.id">{{ m.name }}</SelectItem>
    </SelectContent>
  </Select>
</template>
