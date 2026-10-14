<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'

const { load } = useLookups()
const route = useRoute()
const colorMode = useColorMode()
const lock = useAppLock()
useAppLockWatcher()

useHead({
  meta: [{ key: 'theme-color', name: 'theme-color', content: computed(() => (colorMode.value === 'dark' ? '#1D1D1F' : '#F5F5F7')) }],
})

const { signedIn } = useAuth()
watch(signedIn, (isIn) => {
  if (isIn) load().catch(() => toast.error('Could not load your categories. Check your connection and try again.'))
}, { immediate: true })
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout :name="route.path === '/login' ? false : 'default'">
    <NuxtPage keepalive />
  </NuxtLayout>
  <LockScreen v-if="lock.active.value && lock.locked.value" />
  <Toaster :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
</template>
