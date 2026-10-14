<script setup lang="ts">
import { PhScan } from '@phosphor-icons/vue'

const lock = useAppLock()
const pin = ref('')
const message = ref('')
const busy = ref(false)

async function tryPin(value: string) {
  busy.value = true
  const result = await lock.unlockWithPin(value)
  busy.value = false
  pin.value = ''
  if (!result.ok) message.value = result.triesLeft > 0 ? `Wrong PIN. ${result.triesLeft} ${result.triesLeft === 1 ? 'try' : 'tries'} left.` : 'Too many wrong PINs. Sign in again.'
}

async function tryBiometric() {
  message.value = ''
  if (!(await lock.unlockWithBiometric())) message.value = 'Face ID did not work. Enter your PIN.'
}

onMounted(() => { if (lock.hasBiometric.value) setTimeout(tryBiometric, 350) })
</script>

<template>
  <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-ground px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]" role="dialog" aria-modal="true" aria-label="App locked">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="t-title">Enter PIN</h1>
      <p class="t-secondary min-h-5" :class="message ? 'text-alert' : 'text-muted-foreground'" role="status">{{ message || 'Unlock Wallet Wyse' }}</p>
    </div>
    <PinPad v-model="pin" :disabled="busy" @complete="tryPin">
      <template #left>
        <button v-if="lock.hasBiometric.value" type="button" class="flex size-[76px] items-center justify-center rounded-full text-brand-text" aria-label="Use Face ID" @click="tryBiometric"><PhScan :size="32" /></button>
      </template>
    </PinPad>
  </div>
</template>
