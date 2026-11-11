<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

defineProps<{ title: string; description?: string }>()
const open = defineModel<boolean>('open', { required: true })
const isDesktop = useIsDesktop()
const { inset, visibleHeight } = useKeyboardInset()
const typing = computed(() => inset.value > 80)
// While the keyboard is up the sheet sits on top of it and never grows taller than what is left of the screen.
const sheetStyle = computed(() => (typing.value ? { bottom: `${inset.value}px` } : undefined))
const bodyStyle = computed(() => ({ maxHeight: typing.value ? `${Math.max(visibleHeight.value - 24, 200)}px` : '85dvh' }))
// Brings the field being typed in back into view when the keyboard opens.
const reveal = (ev: FocusEvent) => {
  const el = ev.target as HTMLElement | null
  if (el?.matches('input, textarea, select')) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}
</script>

<template>
  <Dialog v-if="isDesktop" v-model:open="open">
    <DialogContent :show-close-button="false" class="max-h-[90dvh] gap-4 overflow-y-auto rounded-2xl bg-surface sm:max-w-[480px]">
      <DialogHeader>
        <div class="flex items-center justify-between gap-3"><DialogTitle class="t-heading">{{ title }}</DialogTitle><slot name="title-end" /></div>
        <DialogDescription :class="description ? 'text-muted-foreground' : 'sr-only'">{{ description ?? title }}</DialogDescription>
      </DialogHeader>
      <slot />
    </DialogContent>
  </Dialog>
  <Drawer v-else v-model:open="open">
    <DrawerContent class="bg-surface data-[swipe-direction=down]:rounded-t-2xl" :style="sheetStyle">
      <div class="overflow-y-auto overscroll-contain px-4" :class="typing ? 'pb-4' : 'pb-[calc(24px+env(safe-area-inset-bottom))]'" :style="bodyStyle" @focusin="reveal">
        <DrawerHeader class="px-0 text-left">
          <div class="flex items-center justify-between gap-3"><DrawerTitle class="t-heading">{{ title }}</DrawerTitle><slot name="title-end" /></div>
          <DrawerDescription :class="description ? 'text-muted-foreground' : 'sr-only'">{{ description ?? title }}</DrawerDescription>
        </DrawerHeader>
        <slot />
      </div>
    </DrawerContent>
  </Drawer>
</template>
