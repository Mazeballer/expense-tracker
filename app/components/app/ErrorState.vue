<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{ what: string }>()
defineEmits<{ retry: [] }>()
const online = useOnline()
</script>

<template>
  <div class="flex flex-col items-start gap-4 border-y border-line py-6">
    <p v-if="online">Could not load your {{ what }}. Check your connection and try again.</p>
    <p v-else>You're offline. Reconnect to see and save expenses.</p>
    <Button variant="outline" class="h-11" @click="$emit('retry')">Try again</Button>
  </div>
</template>
