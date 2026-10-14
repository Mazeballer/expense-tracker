<script setup lang="ts">
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue'
import { formatMoney } from '~/lib/format'
import { monthName } from '~/lib/date'
import type { LeftToSpend, PlanSummary } from '~/lib/finance'

const props = defineProps<{ plan: PlanSummary; figures: LeftToSpend; month: string }>()
const over = computed(() => props.figures.over > 0)

const rays = computed(() => over.value
  ? ['#D8382F 0deg', '#EE7A4E 20deg', '#1E0710 42deg', '#8A1836 70deg', '#BC3F56 100deg', '#E8948F 125deg', '#B02E66 150deg', '#1E0710 172deg', '#9E2142 195deg', '#CF6C74 230deg', '#B02E48 265deg', '#821B3C 300deg', '#C04A36 335deg', '#D8382F 360deg']
  : ['#2A62E0 0deg', '#4580EC 20deg', '#040B2B 42deg', '#123EB4 70deg', '#2A5ED6 100deg', '#7AA2F0 125deg', '#3B6BDE 150deg', '#030924 172deg', '#1A4DCE 195deg', '#6896EC 230deg', '#2B5CD4 265deg', '#1C4CC6 300deg', '#2A5ED6 325deg', '#3F72E6 345deg', '#2A62E0 360deg'])

const rayStyle = computed(() => ({ backgroundImage: `conic-gradient(from 0deg at 52% 82%, ${rays.value.join(', ')})` }))
const coreStyle = computed(() => ({
  backgroundImage: `radial-gradient(ellipse 24% 30% at 52% 90%, ${over.value ? '#1E0710' : '#030720'}, transparent)`,
}))

const hidden = useLocalStorage('hide-balance', false)
const money = (n: number) => (hidden.value ? 'RM ••••' : formatMoney(n))

const counted = useState('hero-counted', () => false)
const counting = ref<number | null>(null)
const fillReady = ref(counted.value)
const leftShown = computed(() => counting.value ?? props.figures.left)
const barWidth = computed(() => (fillReady.value ? props.figures.progress * 100 : 0))

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (counted.value || reduce) {
    counted.value = true
    fillReady.value = true
    return
  }
  counted.value = true
  const target = props.figures.left
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 900)
    counting.value = t < 1 ? Math.round(target * (1 - Math.pow(1 - t, 3)) * 100) / 100 : null
    if (t < 1) requestAnimationFrame(tick)
  }
  counting.value = 0
  requestAnimationFrame(tick)
  requestAnimationFrame(() => { fillReady.value = true })
})
</script>

<template>
  <section
    aria-label="Left to spend"
    class="relative isolate transform-gpu overflow-hidden rounded-3xl p-6"
    :class="plan.hasPlan ? 'text-white' : 'border border-line bg-surface'"
  >
    <template v-if="plan.hasPlan">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute -inset-[25%] blur-2xl" :style="rayStyle" />
        <div class="absolute inset-0 blur-xl" :style="coreStyle" />
        <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,32,0.18),rgba(4,8,32,0.5))]" />
      </div>
      <div class="[text-shadow:0_1px_14px_rgba(6,12,40,0.45)]">
        <p class="t-secondary text-white">Left to spend</p>
        <div class="mt-1 flex items-end justify-between gap-3">
          <p class="t-hero text-white">{{ money(leftShown) }}</p>
          <button
            type="button"
            class="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full text-white/90 hover:text-white"
            :aria-label="hidden ? 'Show amounts' : 'Hide amounts'"
            :aria-pressed="hidden"
            @click="hidden = !hidden"
          >
            <component :is="hidden ? PhEyeSlash : PhEye" :size="24" />
          </button>
        </div>
        <div
          class="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-label="Spent so far"
          :aria-valuenow="Math.round(figures.progress * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-white transition-[width] duration-700 ease-out" :style="{ width: `${barWidth}%` }" />
        </div>
        <p v-if="over" class="t-secondary mt-3 text-white">{{ money(figures.over) }} over for {{ monthName(month) }}</p>
        <dl class="mt-5 grid grid-cols-2 divide-x divide-white/25 border-t border-white/25 pt-4">
          <div class="pr-4">
            <dt class="t-secondary text-white/85">Spent</dt>
            <dd class="t-heading mt-1">{{ money(figures.spent) }}</dd>
          </div>
          <div class="pl-4">
            <dt class="t-secondary text-white/85">Available</dt>
            <dd class="t-heading mt-1">{{ money(figures.available) }}</dd>
          </div>
        </dl>
      </div>
    </template>
    <template v-else>
      <p class="text-muted-foreground">Spent in {{ monthName(month) }}</p>
      <p class="t-hero mt-2 text-ink">{{ formatMoney(figures.spent) }}</p>
      <p class="t-secondary mt-3 text-muted-foreground">No income or fixed costs are set for this month. Add them in Settings.</p>
    </template>
  </section>
</template>
