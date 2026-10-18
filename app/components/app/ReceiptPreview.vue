<script setup lang="ts">
import { PhCamera, PhImage } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ photo: File }>()
const emit = defineEmits<{ use: []; pick: [photo: File] }>()

const lock = useAppLock()
const camera = ref<HTMLInputElement | null>(null)
const library = ref<HTMLInputElement | null>(null)

const url = ref('')
watch(() => props.photo, (file) => {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = URL.createObjectURL(file)
}, { immediate: true })
onBeforeUnmount(() => URL.revokeObjectURL(url.value))

const open = (input: HTMLInputElement | null) => { lock.grace(); input?.click() }
function onPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('pick', file)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <img :src="url" alt="Your receipt" class="max-h-[50dvh] w-full rounded-2xl border border-line bg-surface object-contain">
    <Button type="button" class="h-12" @click="emit('use')">Use photo</Button>
    <div class="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" class="h-11 gap-2" @click="open(camera)"><PhCamera :size="20" />Retake</Button>
      <Button type="button" variant="outline" class="h-11 gap-2" @click="open(library)"><PhImage :size="20" />Choose another</Button>
    </div>
    <input ref="camera" type="file" accept="image/*" capture="environment" class="sr-only" tabindex="-1" aria-label="Take a receipt photo" @change="onPick">
    <input ref="library" type="file" accept="image/*" class="sr-only" tabindex="-1" aria-label="Choose a receipt photo" @change="onPick">
  </div>
</template>
