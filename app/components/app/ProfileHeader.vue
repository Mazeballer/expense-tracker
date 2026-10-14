<script setup lang="ts">
import { PhCamera } from '@phosphor-icons/vue'
import { greetingKL } from '~/lib/date'

const { firstName, avatarUrl, setAvatar } = useProfile()
const fileInput = ref<HTMLInputElement | null>(null)
const lock = useAppLock()
const pick = () => { lock.grace(); fileInput.value?.click() }

const initial = computed(() => firstName.value?.charAt(0).toUpperCase() ?? '')

async function onPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await setAvatar(file)
}
</script>

<template>
  <header class="flex items-center gap-3">
    <input ref="fileInput" type="file" accept="image/*" class="sr-only" tabindex="-1" aria-label="Upload profile photo" @change="onPick">
    <button
      type="button"
      class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand-text t-heading"
      aria-label="Change profile photo"
      @click="pick"
    >
      <img v-if="avatarUrl" :src="avatarUrl" alt="" class="size-full object-cover">
      <span v-else-if="initial" aria-hidden="true">{{ initial }}</span>
      <PhCamera v-else :size="20" aria-hidden="true" />
    </button>
    <div class="min-w-0 flex-1">
      <p class="t-secondary text-muted-foreground">{{ greetingKL() }},</p>
      <h1 class="t-heading truncate">{{ firstName ?? 'welcome back' }}</h1>
    </div>
  </header>
</template>
