<script setup lang="ts">
import { PhCalendarBlank } from '@phosphor-icons/vue'
import { parseDate } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDay } from '~/lib/date'

const model = defineModel<string>({ required: true })
defineProps<{ id?: string }>()
const open = ref(false)
const value = computed(() => (model.value ? parseDate(model.value) : undefined))

function pick(v: unknown) {
  if (v && typeof (v as { toString: () => string }).toString === 'function') {
    model.value = (v as { toString: () => string }).toString()
    open.value = false
  }
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="id" type="button" variant="outline" class="h-11 w-full justify-start gap-3 px-3 font-normal">
        <PhCalendarBlank :size="20" />
        {{ formatDay(model) }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar :model-value="value" locale="en-GB" initial-focus @update:model-value="pick" />
    </PopoverContent>
  </Popover>
</template>
