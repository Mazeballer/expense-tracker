<script setup lang="ts">
import { PhCaretRight } from '@phosphor-icons/vue'
import type { Component } from 'vue'

defineProps<{ label: string; icon?: Component; value?: string; to?: string; danger?: boolean }>()
defineEmits<{ click: [] }>()
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <li class="border-b border-line last:border-b-0">
    <component
      :is="to ? NuxtLink : 'button'"
      :to="to"
      :type="to ? undefined : 'button'"
      class="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left"
      :class="danger ? 'text-alert' : ''"
      @click="$emit('click')"
    >
      <span v-if="icon" class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted" :class="danger ? '' : 'text-ink'"><component :is="icon" :size="20" /></span>
      <span class="min-w-0 flex-1 truncate">{{ label }}</span>
      <span v-if="value" class="t-secondary max-w-[50%] truncate text-muted-foreground">{{ value }}</span>
      <PhCaretRight v-if="to" :size="16" class="shrink-0 text-muted-foreground" />
    </component>
  </li>
</template>
