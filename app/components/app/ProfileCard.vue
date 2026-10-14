<script setup lang="ts">
import { PhCamera } from '@phosphor-icons/vue'

const { firstName, avatarUrl, setAvatar, clearAvatar } = useProfile()
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
  <section aria-label="Profile" class="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
    <input ref="fileInput" type="file" accept="image/*" class="sr-only" tabindex="-1" aria-label="Upload profile photo" @change="onPick">
    <button type="button" class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand-text t-title" aria-label="Change profile photo" @click="pick">
      <img v-if="avatarUrl" :src="avatarUrl" alt="" class="size-full object-cover">
      <span v-else-if="initial" aria-hidden="true">{{ initial }}</span>
      <PhCamera v-else :size="24" aria-hidden="true" />
    </button>
    <div class="min-w-0 flex-1">
      <p class="t-heading truncate">{{ firstName ?? 'Your profile' }}</p>
      <div class="flex gap-4">
        <button type="button" class="min-h-11 t-secondary text-brand-text" @click="pick">{{ avatarUrl ? 'Change photo' : 'Add photo' }}</button>
        <button v-if="avatarUrl" type="button" class="min-h-11 t-secondary text-muted-foreground" @click="clearAvatar">Remove</button>
      </div>
    </div>
  </section>
</template>
