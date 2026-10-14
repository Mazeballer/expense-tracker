<script setup lang="ts">
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { addMonths, currentMonth, formatMonth } from '~/lib/date'

const month = defineModel<string>({ required: true })
const props = defineProps<{ allowFuture?: boolean }>()
const atCurrent = computed(() => !props.allowFuture && month.value >= currentMonth())
</script>

<template>
  <div class="flex w-full items-center justify-between lg:w-auto lg:justify-start lg:gap-1">
    <Button variant="ghost" size="icon" class="size-11" aria-label="Previous month" @click="month = addMonths(month, -1)">
      <PhCaretLeft :size="20" />
    </Button>
    <span class="flex-1 text-center font-medium lg:min-w-[9.5rem] lg:flex-none" aria-live="polite">{{ formatMonth(month) }}</span>
    <Button variant="ghost" size="icon" class="size-11" aria-label="Next month" :disabled="atCurrent" @click="month = addMonths(month, 1)">
      <PhCaretRight :size="20" />
    </Button>
  </div>
</template>
