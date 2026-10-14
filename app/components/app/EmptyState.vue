<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{ message: string; action?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-start gap-4 border-y border-line py-6">
    <p class="text-muted-foreground">{{ message }}</p>
    <Button v-if="action" class="h-11" @click="$emit('action')">{{ action }}</Button>
  </div>
</template>
