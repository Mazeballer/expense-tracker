<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

defineProps<{ id?: string; highlight?: boolean; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="relative">
    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RM</span>
    <Input
      :id="id"
      v-model="model"
      inputmode="decimal"
      autocomplete="off"
      :placeholder="placeholder ?? '0.00'"
      :class="cn('h-11 pl-12 text-right', highlight && 'border-2 border-brand')"
    />
  </div>
</template>
