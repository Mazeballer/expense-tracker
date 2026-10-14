<script setup lang="ts">
import { PhBackspace } from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{ length?: number; disabled?: boolean }>(), { length: 4 })
const pin = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [pin: string] }>()

function press(d: string) {
  if (props.disabled || pin.value.length >= props.length) return
  const next = pin.value + d
  pin.value = next
  if (next.length === props.length) emit('complete', next)
}
const back = () => { pin.value = pin.value.slice(0, -1) }
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <div class="flex gap-4" role="img" :aria-label="`${pin.length} of ${length} digits entered`">
      <span v-for="i in length" :key="i" class="size-4 rounded-full border-2 border-ink transition-colors" :class="i <= pin.length ? 'bg-ink' : 'bg-transparent'" />
    </div>
    <div class="grid grid-cols-3 gap-x-6 gap-y-4">
      <button
        v-for="d in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
        :key="d"
        type="button"
        class="size-[76px] rounded-full border border-line bg-surface text-3xl font-medium"
        :disabled="disabled"
        @click="press(d)"
      >{{ d }}</button>
      <div class="flex size-[76px] items-center justify-center"><slot name="left" /></div>
      <button type="button" class="size-[76px] rounded-full border border-line bg-surface text-3xl font-medium" :disabled="disabled" @click="press('0')">0</button>
      <button type="button" class="flex size-[76px] items-center justify-center rounded-full text-ink" aria-label="Delete digit" :disabled="disabled" @click="back"><PhBackspace :size="28" /></button>
    </div>
  </div>
</template>
