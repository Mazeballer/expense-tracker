<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12" aria-hidden="true">
    <div class="flex flex-col gap-3 lg:col-span-5">
      <Skeleton class="h-[196px] w-full rounded-2xl" />
      <Skeleton class="h-4 w-48" />
    </div>
    <Skeleton class="h-[240px] w-full lg:col-span-7" />
    <div class="lg:col-span-12">
      <ExpenseListSkeleton :rows="5" />
    </div>
  </div>
</template>
