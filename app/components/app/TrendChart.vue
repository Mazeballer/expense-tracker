<script setup lang="ts">
import { formatMoney } from '~/lib/format'

type Point = { month: string; label: string; total: number }
const props = defineProps<{ data: Point[]; selected: string; bleed?: boolean }>()

const HEIGHT = 190
const TOP = 24
const BASE = 150

const padLeft = computed(() => (props.bleed ? 0 : 12))
const padRight = computed(() => (props.bleed ? 16 : 12))
const LABEL_INSET = 28

const el = ref<HTMLElement | null>(null)
const { width } = useElementSize(el)
const isDesktop = useIsDesktop()

const hovered = ref<number | null>(null)
const selectedIndex = computed(() => Math.max(0, props.data.findIndex((d) => d.month === props.selected)))
const activeIndex = computed(() => hovered.value ?? selectedIndex.value)
const active = computed(() => props.data[activeIndex.value] ?? null)

const points = computed(() => {
  const n = props.data.length
  if (n < 2 || width.value === 0) return []
  const max = Math.max(...props.data.map((d) => d.total), 1) * 1.1
  const step = (width.value - padLeft.value - padRight.value) / (n - 1)
  return props.data.map((d, i) => [padLeft.value + i * step, BASE - (d.total / max) * (BASE - TOP)] as [number, number])
})

function smoothPath(pts: [number, number][]): string {
  const n = pts.length
  if (n < 2) return ''
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i]![0])
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i]![1]) / dx[i]!)
  const t = pts.map((_, i) => (i === 0 ? m[0]! : i === n - 1 ? m[n - 2]! : m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i]! / m[i]!
    const b = t[i + 1]! / m[i]!
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      t[i] = k * a * m[i]!
      t[i + 1] = k * b * m[i]!
    }
  }
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]!
    const [x1, y1] = pts[i + 1]!
    const h = dx[i]! / 3
    d += ` C${(x0 + h).toFixed(1)} ${(y0 + t[i]! * h).toFixed(1)} ${(x1 - h).toFixed(1)} ${(y1 - t[i + 1]! * h).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  return d
}

const path = computed(() => smoothPath(points.value))
const marker = computed(() => points.value[activeIndex.value] ?? null)

const labelIndexes = computed(() => {
  const last = props.data.length - 1
  return isDesktop.value ? props.data.map((_, i) => i) : [1, 3, 5, 7, 9, 11].filter((v) => v <= last)
})
const labelX = (i: number) => Math.min(width.value - LABEL_INSET, Math.max(LABEL_INSET, points.value[i]![0]))

function scrub(ev: PointerEvent) {
  const box = el.value?.getBoundingClientRect()
  if (!box || props.data.length < 2) return
  const step = (box.width - padLeft.value - padRight.value) / (props.data.length - 1)
  hovered.value = Math.min(props.data.length - 1, Math.max(0, Math.round((ev.clientX - box.left - padLeft.value) / step)))
}
</script>

<template>
  <div class="flex flex-col gap-3" :class="bleed && '-mx-4'">
    <p v-if="active" class="t-secondary text-muted-foreground" :class="bleed && 'px-4'" aria-live="polite">
      {{ active.label }} <span class="font-medium text-ink">{{ formatMoney(active.total) }}</span>
    </p>
    <div ref="el" class="w-full touch-pan-y select-none overflow-hidden" :style="{ height: `${HEIGHT}px` }" @pointermove="scrub" @pointerdown="scrub" @pointerleave="hovered = null">
      <svg v-if="path" class="block max-w-full" :width="width" :height="HEIGHT" :viewBox="`0 0 ${width} ${HEIGHT}`" role="img" :aria-label="`Spending for the last ${data.length} months`">
        <path :d="path" fill="none" stroke="var(--brand)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle v-if="marker" :cx="marker[0]" :cy="marker[1]" r="10" fill="var(--background)" stroke="var(--brand)" stroke-width="3.5" />
        <text
          v-for="i in labelIndexes"
          :key="data[i]!.month"
          :x="labelX(i)"
          :y="HEIGHT - 8"
          text-anchor="middle"
          font-size="12"
          :font-weight="i === activeIndex ? 600 : 500"
          :fill="i === activeIndex ? 'var(--ink)' : 'var(--muted-ink)'"
        >{{ data[i]!.label }}</text>
      </svg>
    </div>
  </div>
</template>
