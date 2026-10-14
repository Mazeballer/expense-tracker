<script setup lang="ts">
const { show } = useAddSheet()
const { pull, refreshing, threshold } = usePullToRefresh(() => bumpData())
const sheetReady = ref(false)
onNuxtReady(() => { sheetReady.value = true })

useEventListener('keydown', (ev: KeyboardEvent) => {
  const target = ev.target as HTMLElement
  if (ev.key !== 'n' || ev.metaKey || ev.ctrlKey || ev.altKey) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return
  ev.preventDefault()
  show()
})
</script>

<template>
  <div class="min-h-dvh bg-ground">
    <PullIndicator :pull="pull" :refreshing="refreshing" :threshold="threshold" />
    <AppSidebar />
    <OfflineBanner />
    <main class="mx-auto w-full max-w-[560px] px-4 pb-[calc(64px+env(safe-area-inset-bottom)+96px)] pt-6 lg:ml-60 lg:w-auto lg:max-w-none lg:px-8 lg:pb-12 lg:pt-8">
      <div class="mx-auto w-full lg:max-w-[1120px]">
        <slot />
      </div>
    </main>
    <AddButton />
    <BottomNav />
    <LazyAddExpenseSheet v-if="sheetReady" />
  </div>
</template>
