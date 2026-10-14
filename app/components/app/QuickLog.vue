<script setup lang="ts">
import { PhArrowRight, PhCamera } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDay } from '~/lib/date'
import { formatMoney } from '~/lib/format'

const emit = defineEmits<{ done: []; receipt: [photo: File] }>()

const { preview } = useQuickAdd()
const { paymentMethods, categoryName, categoryIcon, methodName } = useLookups()
const logExpense = useLogExpense()
const online = useOnline()
const lock = useAppLock()
const lastMethod = useLocalStorage<string>('last-payment-method', '')

const text = ref('')
const saving = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)

const defaultMethod = computed(() => {
  const usable = paymentMethods.value.filter((m) => !m.archived)
  return usable.find((m) => m.id === lastMethod.value)?.id ?? usable[0]?.id ?? null
})

const draft = computed(() => (text.value.trim() ? preview(text.value) : null))
const pickedMethod = usePickedMethod()
const methodId = computed(() => pickedMethod.value ?? draft.value?.paymentMethodId ?? defaultMethod.value)
watch(() => draft.value?.paymentMethodId, (id) => { if (id) pickedMethod.value = id })
const needsAmount = computed(() => text.value.trim() !== '' && !draft.value)
const large = computed(() => (draft.value?.amount ?? 0) >= 1000)

async function submit() {
  const d = draft.value
  if (!d || saving.value || !online.value) return
  saving.value = true
  const ok = await logExpense({
    amount: d.amount,
    description: d.description,
    categoryId: d.categoryId,
    paymentMethodId: methodId.value,
    note: null,
    date: d.date,
    source: 'quick_add',
  })
  saving.value = false
  if (ok) emit('done')
}

function onPhoto(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('receipt', file)
}

onMounted(() => setTimeout(() => document.getElementById('quick-log')?.focus(), 250))
</script>

<template>
  <div class="flex flex-col gap-4">
    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <label for="quick-log" class="sr-only">Describe the expense</label>
        <div class="flex items-center gap-2">
          <Input
            id="quick-log"
            v-model="text"
            class="h-14 flex-1 rounded-full px-5 text-base"
            placeholder="e.g. 12.50 lunch cc"
            autocomplete="off"
            autocapitalize="sentences"
            enterkeyhint="done"
          />
          <Button type="submit" size="icon" class="size-14 shrink-0" :disabled="!draft || saving || !online" aria-label="Add expense">
            <PhArrowRight :size="24" weight="bold" />
          </Button>
        </div>
        <p v-if="needsAmount" class="t-secondary text-muted-foreground" role="status">Add an amount, for example 12.50 lunch.</p>
      </div>

      <div v-if="draft" class="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3" aria-live="polite">
        <IconBubble :icon="categoryIcon(draft.categoryId)" />
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium">{{ draft.description }}</span>
          <span class="block truncate t-caption text-muted-foreground">
            {{ categoryName(draft.categoryId) }}<template v-if="methodId">, {{ methodName(methodId) }}</template>, {{ formatDay(draft.date) }}
          </span>
        </span>
        <span class="font-semibold">{{ formatMoney(draft.amount) }}</span>
      </div>
      <p v-if="large" class="t-secondary text-alert" role="status">Check the amount. This is {{ formatMoney(draft!.amount) }}.</p>

    </form>

    <Button type="button" class="h-12 gap-2" @click="lock.grace(); photoInput?.click()"><PhCamera :size="20" />Scan receipt</Button>
    <input ref="photoInput" type="file" accept="image/*" capture="environment" class="sr-only" tabindex="-1" aria-label="Receipt photo" @change="onPhoto">
  </div>
</template>
