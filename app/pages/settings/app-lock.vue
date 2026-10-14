<script setup lang="ts">
import { PhPassword, PhScan, PhUserFocus } from '@phosphor-icons/vue'
import { toast } from 'vue-sonner'

const lock = useAppLock()
const sheet = reactive({ open: false, mode: 'setup' as 'setup' | 'change' })
const turnOffOpen = ref(false)

const openSetup = (mode: 'setup' | 'change') => Object.assign(sheet, { open: true, mode })

async function savePin(pin: string) {
  const first = !lock.enabled.value
  await lock.setPin(pin)
  sheet.open = false
  toast.success(first ? 'Face ID is on' : 'PIN changed')
  if (first && lock.biometricSupported.value && !(await lock.enableBiometric())) toast('Face ID was not set up. You can turn it on here.')
}

async function toggleBiometric() {
  if (lock.hasBiometric.value) return lock.disableBiometric()
  if (!(await lock.enableBiometric())) toast.error('Could not set up Face ID. Try again.')
}

function turnOff() {
  lock.reset()
  toast.success('Face ID is off')
}
</script>

<template>
  <div class="flex max-w-xl flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Face ID</PageTitle>
    </div>

    <SettingsGroup v-if="!lock.enabled.value">
      <SettingsRow label="Turn on Face ID and PIN" :icon="PhUserFocus" @click="openSetup('setup')" />
    </SettingsGroup>
    <SettingsGroup v-else>
      <SettingsRow v-if="lock.biometricSupported.value" label="Unlock with Face ID" :icon="PhScan" :value="lock.hasBiometric.value ? 'On' : 'Off'" @click="toggleBiometric" />
      <SettingsRow label="Change PIN" :icon="PhPassword" @click="openSetup('change')" />
      <SettingsRow label="Turn off Face ID" :icon="PhUserFocus" danger @click="turnOffOpen = true" />
    </SettingsGroup>

    <p class="t-secondary px-4 text-muted-foreground">
      Asks for Face ID or your PIN every time you open the app.
      <template v-if="!lock.standalone.value"> Install the app to your home screen for the lock to work.</template>
    </p>

    <ResponsiveSheet v-model:open="sheet.open" :title="sheet.mode === 'setup' ? 'Set a PIN' : 'Change PIN'">
      <PinSetup v-if="sheet.open" @done="savePin" />
    </ResponsiveSheet>
    <ConfirmDialog v-model:open="turnOffOpen" title="Turn off Face ID?" description="The app will open without Face ID or a PIN." confirm-label="Turn off" @confirm="turnOff" />
  </div>
</template>
