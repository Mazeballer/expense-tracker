<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{ error: { statusCode?: number } }>()
const reload = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 bg-ground px-6 text-center">
    <h1 class="t-title text-ink">{{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}</h1>
    <p class="text-muted-foreground">{{ error.statusCode === 404 ? 'That page does not exist.' : 'Please try again.' }}</p>
    <Button class="h-11" @click="reload">Back to Wallet Wyse</Button>
  </main>
</template>
