<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue'

const { show } = useAddSheet()
</script>

<template>
  <button
    type="button"
    aria-label="Add expense"
    class="fixed bottom-[calc(env(safe-area-inset-bottom)+12px+64px+16px)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 lg:hidden"
    @click="show()"
  >
    <PhPlus :size="20" weight="bold" />
  </button>
</template>
