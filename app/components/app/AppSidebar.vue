<script setup lang="ts">
import { PhPlus, PhSignOut } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '~/lib/nav'

const route = useRoute()
const { show } = useAddSheet()
const { signOut } = useAuth()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <aside class="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-ground p-4 lg:flex">
    <Button class="mb-6 h-11 justify-start gap-3 px-3" @click="show()">
      <PhPlus :size="20" />
      Add expense
      <kbd class="ml-auto t-caption opacity-80">N</kbd>
    </Button>
    <nav aria-label="Main" class="flex flex-col gap-1">
      <NuxtLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        class="flex h-11 items-center gap-3 rounded-[10px] px-3"
        :class="isActive(item.to) ? 'bg-hover font-medium text-brand-text' : 'text-ink hover:bg-hover'"
      >
        <component :is="item.icon" :size="20" :weight="isActive(item.to) ? 'fill' : 'regular'" />
        {{ item.label }}
      </NuxtLink>
    </nav>
    <div class="mt-auto flex flex-col gap-1">
      <ThemeToggle />
      <Button variant="ghost" class="h-11 justify-start gap-3 px-3" @click="signOut">
        <PhSignOut :size="20" />
        Sign out
      </Button>
    </div>
  </aside>
</template>
