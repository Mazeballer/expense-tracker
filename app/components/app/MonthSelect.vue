<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addMonths, currentMonth, formatMonth } from '~/lib/date'

const model = defineModel<string>({ required: true })
const options = computed(() => [currentMonth(), addMonths(currentMonth(), 1)])
</script>

<template>
  <Select v-model="model">
    <SelectTrigger class="h-11 w-full"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem v-for="m in options" :key="m" :value="m">{{ formatMonth(m) }}</SelectItem>
    </SelectContent>
  </Select>
</template>
