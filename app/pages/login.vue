<script setup lang="ts">
import { PhWallet } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: false })

const route = useRoute()
const { signIn } = useAuth()
const signingIn = ref(false)
const notAllowed = computed(() => route.query.error === 'not-allowed')

async function start() {
  signingIn.value = true
  try {
    await signIn()
  } catch {
    signingIn.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-ground px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(24px+env(safe-area-inset-top))]">
    <div class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div class="relative flex size-24 items-center justify-center overflow-hidden rounded-[28px] bg-[#0B1E5B] text-white" aria-hidden="true">
        <div class="absolute -right-6 -top-6 size-24 rounded-full bg-[#4580EC] opacity-80 blur-xl" />
        <div class="absolute -bottom-8 -left-4 size-20 rounded-full bg-[#1A4DCE] blur-xl" />
        <PhWallet :size="44" weight="duotone" class="relative" />
      </div>
      <div class="flex flex-col gap-2">
        <h1 class="t-title text-ink">Wallet Wyse</h1>
        <p class="text-muted-foreground">Your wallet, but wise.</p>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <p v-if="notAllowed" class="t-secondary text-center text-alert" role="alert">This Google account does not have access. Sign in with a different account.</p>
      <Button variant="outline" class="h-14 gap-3 bg-surface text-base" :disabled="signingIn" @click="start">
        <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.34v3.09A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.34a12 12 0 0 0 0 10.78z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.34 6.61l4.02 3.1A7.15 7.15 0 0 1 12 4.75z" />
        </svg>
        {{ signingIn ? 'Signing in' : 'Continue with Google' }}
      </Button>
      <p class="t-caption text-center text-muted-foreground">Only approved accounts can sign in. <NuxtLink to="/privacy" class="underline">Privacy</NuxtLink></p>
    </div>
  </main>
</template>
