<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDay } from '~/lib/date'
import type { ApiToken } from '~/types'

const tokens = useApiTokens()
const { data, loading, error, reload } = useResource(() => tokens.list())

const fresh = ref('')
const creating = ref(false)
const toRevoke = ref<ApiToken | null>(null)
const revoking = computed({ get: () => toRevoke.value !== null, set: (v) => { if (!v) toRevoke.value = null } })
const url = computed(() => `${window.location.origin}/api/apple-pay`)

async function create() {
  creating.value = true
  try {
    fresh.value = await tokens.create('Apple Pay')
    bumpData()
  } catch {
    toast.error('Could not create the token. Try again.')
  } finally {
    creating.value = false
  }
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what} copied`)
  } catch {
    toast.error('Could not copy. Press and hold the text to copy it.')
  }
}

async function revoke() {
  const t = toRevoke.value
  toRevoke.value = null
  if (!t) return
  await runSave(() => tokens.remove(t.id), 'Token revoked')
}

const day = (iso: string) => formatDay(iso.slice(0, 10))
</script>

<template>
  <div class="flex max-w-xl flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Apple Pay auto-log</PageTitle>
      <p class="t-secondary mt-1 text-muted-foreground">Every Apple Pay payment is saved here by itself. Your iPhone sends the shop and amount, and the AI picks the category.</p>
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="t-heading">1. Make your private token</h2>
      <div v-if="fresh" class="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4" role="status">
        <p class="font-medium">Copy this now. It is shown only once.</p>
        <p class="break-all rounded-lg bg-muted p-3 font-mono text-sm select-all">{{ fresh }}</p>
        <Button class="h-11" @click="copy(fresh, 'Token')">Copy token</Button>
      </div>
      <Button v-else class="h-12" :disabled="creating" @click="create">{{ creating ? 'Making' : 'Make a new token' }}</Button>
      <p class="t-secondary text-muted-foreground">Treat it like a password. Anyone with it can add expenses to your account, but cannot read anything.</p>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="t-heading">2. Your tokens</h2>
      <Skeleton v-if="loading" class="h-16 w-full" aria-hidden="true" />
      <ErrorState v-else-if="error || !data" what="tokens" @retry="reload" />
      <p v-else-if="!data.length" class="text-muted-foreground">No tokens yet.</p>
      <ul v-else class="border-t border-line">
        <li v-for="t in data" :key="t.id" class="flex min-h-14 items-center gap-3 border-b border-line py-2">
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ t.label }}</p>
            <p class="t-secondary text-muted-foreground">Made {{ day(t.createdAt) }}, {{ t.lastUsedAt ? `last used ${day(t.lastUsedAt)}` : 'never used' }}</p>
          </div>
          <Button variant="outline" class="h-10" @click="toRevoke = t">Revoke</Button>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="t-heading">3. Set up the Shortcut on your iPhone</h2>
      <ol class="flex list-decimal flex-col gap-2 pl-5">
        <li>Open the Shortcuts app, go to Automation, tap +, and choose Transaction.</li>
        <li>Choose your cards, turn on Run Immediately, then tap Next and New Blank Automation.</li>
        <li>Add the action Get Contents of URL. Set Method to POST and Request Body to JSON.</li>
        <li>Paste the address below as the URL.</li>
        <li>Add four JSON fields, all as Text: token (your token), merchant (the Merchant from Transaction), amount (the Amount), card (the Card or Name).</li>
        <li>Optional: add Show Notification with the Contents of URL so you see "Logged RM 8.40".</li>
      </ol>
      <p class="break-all rounded-lg bg-muted p-3 font-mono text-sm select-all">{{ url }}</p>
      <Button variant="outline" class="h-11" @click="copy(url, 'Address')">Copy address</Button>
      <p class="t-secondary text-muted-foreground">Name your cards in the app like the cards in Wallet (for example Maybank Visa) so each payment goes on the right card. Otherwise credit cards go to your first credit card and the rest to your first debit card.</p>
    </section>

    <ConfirmDialog v-model:open="revoking" title="Revoke this token?" description="The Shortcut using it will stop logging payments until you make a new token." confirm-label="Revoke" @confirm="revoke" />
  </div>
</template>
