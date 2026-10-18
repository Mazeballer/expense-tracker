<script setup lang="ts">
import { PhCheck } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { formatDay } from '~/lib/date'
import { formatMoney, round2 } from '~/lib/format'
import type { ReceiptScan } from '~/types'

const props = defineProps<{ photo: File }>()
const emit = defineEmits<{ done: []; retake: []; typeIt: [] }>()

const { scan, demo } = useReceiptScan()
const { paymentMethods } = useLookups()
const logExpense = useLogExpense()
const online = useOnline()
const lastMethod = useLocalStorage<string>('last-payment-method', '')

const photoUrl = ref('')
const state = ref<'reading' | 'review' | 'failed'>('reading')
const failure = ref('')
const receipt = ref<ReceiptScan | null>(null)
const picked = ref<string[]>([])
const includeExtras = ref(true)
const saving = ref(false)

onMounted(async () => {
  photoUrl.value = URL.createObjectURL(props.photo)
  try {
    const result = await scan(props.photo)
    receipt.value = result
    picked.value = result.items.map((i) => i.id)
    state.value = 'review'
  } catch (e) {
    const err = e as { statusCode?: number; statusMessage?: string; data?: { statusMessage?: string }; message?: string }
    console.error('Receipt scan failed', err)
    failure.value = e instanceof ReceiptScanUnavailable
      ? 'Receipt reading is not available yet.'
      : err.statusCode === 422
        ? 'That does not look like a receipt. Try a clearer, flatter photo.'
        : `Could not read that receipt (${err.statusCode ?? 'network'}: ${err.data?.statusMessage ?? err.statusMessage ?? err.message ?? 'unknown'}).`
    state.value = 'failed'
  }
})
onBeforeUnmount(() => URL.revokeObjectURL(photoUrl.value))

const items = computed(() => receipt.value?.items ?? [])
const subtotal = computed(() => round2(items.value.reduce((t, i) => t + i.amount, 0)))
const mine = computed(() => items.value.filter((i) => picked.value.includes(i.id)))
const mySubtotal = computed(() => round2(mine.value.reduce((t, i) => t + i.amount, 0)))
const extraShare = computed(() => (includeExtras.value && subtotal.value > 0 && receipt.value ? round2((receipt.value.extras * mySubtotal.value) / subtotal.value) : 0))
const myShare = computed(() => round2(mySubtotal.value + extraShare.value))

const extrasPercent = computed(() => (subtotal.value > 0 && receipt.value ? Math.round((receipt.value.extras / subtotal.value) * 1000) / 10 : 0))

const pickedMethod = usePickedMethod()
const methodId = computed(() => {
  if (pickedMethod.value) return pickedMethod.value
  const usable = paymentMethods.value.filter((m) => !m.archived)
  return usable.find((m) => m.id === lastMethod.value)?.id ?? usable[0]?.id ?? null
})

function toggle(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]
}

async function save() {
  const r = receipt.value
  if (!r || !mine.value.length || myShare.value <= 0 || saving.value) return
  saving.value = true
  const names = mine.value.map((i) => i.name)
  const all = mine.value.length === items.value.length
  const description = all ? r.merchant : `${r.merchant}, ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}`
  const note = [
    `Receipt total ${formatMoney(r.total)}.`,
    `Items: ${names.join(', ')}.`,
  ].filter(Boolean).join(' ').slice(0, 500)
  const ok = await logExpense({
    amount: myShare.value,
    description: description.slice(0, 200),
    categoryId: r.categoryId,
    paymentMethodId: methodId.value,
    note,
    date: r.date,
    source: 'receipt',
  })
  saving.value = false
  if (ok) emit('done')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div v-if="state === 'reading'" class="flex flex-col gap-4" aria-live="polite">
      <img :src="photoUrl" alt="Your receipt" class="h-56 w-full rounded-2xl border border-line object-cover">
      <div class="flex flex-col gap-2">
        <p class="font-medium">Reading your receipt</p>
        <div class="h-3 w-full overflow-hidden rounded-full bg-line"><div class="h-full w-2/3 animate-pulse rounded-full bg-brand" /></div>
      </div>
    </div>

    <div v-else-if="state === 'failed'" class="flex flex-col gap-4" role="alert">
      <img :src="photoUrl" alt="Your receipt" class="h-40 w-full rounded-2xl border border-line object-cover">
      <p class="text-muted-foreground">{{ failure }}</p>
      <div class="grid grid-cols-2 gap-2">
        <Button variant="outline" class="h-11" @click="emit('retake')">Take another photo</Button>
        <Button variant="outline" class="h-11" @click="emit('typeIt')">Type it instead</Button>
      </div>
    </div>

    <template v-else-if="receipt">
      <div class="flex items-center gap-3">
        <img :src="photoUrl" alt="Your receipt" class="size-14 shrink-0 rounded-xl border border-line object-cover">
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ receipt.merchant }}</p>
          <p class="t-secondary text-muted-foreground">{{ formatDay(receipt.date) }}, receipt total {{ formatMoney(receipt.total) }}</p>
        </div>
      </div>
      <p v-if="demo" class="t-secondary text-muted-foreground">Demo receipt. Receipt reading is not connected yet.</p>

      <section class="flex flex-col" aria-label="Receipt items">
        <div class="flex items-center justify-between pb-1">
          <h3 class="font-medium">Which items are yours?</h3>
          <button type="button" class="min-h-11 t-secondary text-brand-text" @click="picked = picked.length === items.length ? [] : items.map((i) => i.id)">
            {{ picked.length === items.length ? 'Clear all' : 'Select all' }}
          </button>
        </div>
        <button
          v-for="i in items"
          :key="i.id"
          type="button"
          role="checkbox"
          :aria-checked="picked.includes(i.id)"
          class="flex min-h-14 w-full items-center gap-3 border-t border-line text-left"
          @click="toggle(i.id)"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full border"
            :class="picked.includes(i.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface'"
          ><PhCheck v-if="picked.includes(i.id)" :size="14" weight="bold" /></span>
          <span class="min-w-0 flex-1 truncate">{{ i.name }}</span>
          <span class="font-medium">{{ formatMoney(i.amount) }}</span>
        </button>
      </section>

      <button
        v-if="receipt.extras > 0"
        type="button"
        role="checkbox"
        :aria-checked="includeExtras"
        class="flex min-h-11 items-center gap-3 text-left"
        @click="includeExtras = !includeExtras"
      >
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full border"
          :class="includeExtras ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-surface'"
        ><PhCheck v-if="includeExtras" :size="14" weight="bold" /></span>
        <span class="t-secondary">Include my share of tax and service ({{ formatMoney(receipt.extras) }} in total, about {{ extrasPercent }}% on top of the items)</span>
      </button>

      <div class="rounded-2xl border border-line bg-surface p-4">
        <p class="t-secondary text-muted-foreground">Your share</p>
        <p class="t-title mt-1">{{ formatMoney(myShare) }}</p>
        <p class="t-secondary mt-1 text-muted-foreground">
          {{ mine.length }} of {{ items.length }} items<template v-if="extraShare > 0">, includes {{ formatMoney(extraShare) }} tax and service</template>
        </p>
      </div>

      <div class="sticky bottom-0 -mx-4 flex flex-col gap-1 border-t border-line bg-surface px-4 pb-1 pt-3">
        <Button class="h-12" :disabled="!mine.length || myShare <= 0 || saving || !online" @click="save">Add {{ formatMoney(myShare) }}</Button>
        <Button variant="ghost" class="h-11" @click="emit('retake')">Take another photo</Button>
      </div>
    </template>
  </div>
</template>
