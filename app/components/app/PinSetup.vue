<script setup lang="ts">
const emit = defineEmits<{ done: [pin: string] }>()

const first = ref('')
const pin = ref('')
const message = ref('')
const confirming = computed(() => first.value !== '')

function onComplete(value: string) {
  if (!confirming.value) {
    first.value = value
    pin.value = ''
    message.value = ''
    return
  }
  if (value === first.value) {
    emit('done', value)
    return
  }
  message.value = 'The PINs did not match. Start again.'
  first.value = ''
  pin.value = ''
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 pb-4 pt-2">
    <p class="t-secondary text-center" :class="message ? 'text-alert' : 'text-muted-foreground'" role="status">{{ message || (confirming ? 'Enter the PIN again' : 'Choose a 4-digit PIN') }}</p>
    <PinPad v-model="pin" @complete="onComplete" />
  </div>
</template>
