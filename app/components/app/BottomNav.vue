<script setup lang="ts">
import { NAV_ITEMS } from '~/lib/nav'

const route = useRoute()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const onTap = (to: string) => { if (isActive(to)) window.scrollTo({ top: 0, behavior: 'smooth' }) }
</script>

<template>
  <nav
    aria-label="Main"
    class="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-30 mx-auto max-w-[400px] rounded-full border border-line/60 bg-surface/90 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-surface/65 lg:hidden"
  >
    <ul class="grid h-16 grid-cols-5 items-center px-1">
      <li v-for="item in NAV_ITEMS" :key="item.to">
        <NuxtLink
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="onTap(item.to)"
          class="flex h-12 min-h-11 flex-col items-center justify-center gap-0.5 rounded-full t-caption transition-colors"
          :class="isActive(item.to) ? 'bg-brand/10 text-brand-text' : 'text-muted-foreground'"
        >
          <component :is="item.icon" :size="20" :weight="isActive(item.to) ? 'fill' : 'regular'" />
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
