<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

defineProps<{ title: string; description?: string }>()
const open = defineModel<boolean>('open', { required: true })
const isDesktop = useIsDesktop()
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
    <DrawerContent class="bg-surface data-[swipe-direction=down]:rounded-t-2xl">
      <div class="max-h-[85dvh] overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <DrawerHeader class="px-0 text-left">
          <div class="flex items-center justify-between gap-3"><DrawerTitle class="t-heading">{{ title }}</DrawerTitle><slot name="title-end" /></div>
          <DrawerDescription :class="description ? 'text-muted-foreground' : 'sr-only'">{{ description ?? title }}</DrawerDescription>
        </DrawerHeader>
        <slot />
      </div>
    </DrawerContent>
  </Drawer>
</template>
