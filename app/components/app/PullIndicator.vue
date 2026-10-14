<script setup lang="ts">
import { PhArrowClockwise } from '@phosphor-icons/vue'

const props = defineProps<{ pull: number; refreshing: boolean; threshold: number }>()
const progress = computed(() => Math.min(props.pull / props.threshold, 1))
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center lg:hidden"
    :style="{ transform: `translateY(calc(env(safe-area-inset-top) + ${pull - 44}px))`, opacity: progress }"
    aria-hidden="true"
  >
    <span class="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-brand-text">
      <PhArrowClockwise :size="20" weight="bold" :class="refreshing ? 'animate-spin' : ''" :style="refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }" />
    </span>
  </div>
</template>
