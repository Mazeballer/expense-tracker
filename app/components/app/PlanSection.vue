<script setup lang="ts">
import { PhDotsThree, PhPencilSimple, PhPlus, PhTextAa, PhTrash } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatMoney } from '~/lib/format'
import type { PlanItem } from '~/types'

defineProps<{ title: string; items: PlanItem[]; computedRows?: { label: string; amount: number }[]; total: number }>()
defineEmits<{ add: []; edit: [item: PlanItem]; rename: [item: PlanItem]; remove: [item: PlanItem]; editRate: [] }>()
</script>

<template>
  <section :aria-label="title">
    <div class="mb-1 flex items-center justify-between">
      <h2 class="t-heading">{{ title }}</h2>
      <Button variant="ghost" class="h-11 gap-2" @click="$emit('add')"><PhPlus :size="20" />Add line</Button>
    </div>
    <ul class="border-t border-line">
      <li v-for="r in computedRows" :key="r.label" class="flex min-h-14 items-center gap-2 border-b border-line">
        <button type="button" class="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-left" @click="$emit('editRate')">
          <span class="truncate">{{ r.label }}</span>
          <span class="font-medium">{{ formatMoney(r.amount) }}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-11 shrink-0" :aria-label="`Actions for ${r.label}`"><PhDotsThree :size="20" weight="bold" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="gap-3" @select="$emit('editRate')"><PhPencilSimple :size="20" />Change rate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      <li v-for="i in items" :key="i.id" class="flex min-h-14 items-center gap-2 border-b border-line">
        <button type="button" class="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-left" @click="$emit('edit', i)">
          <span class="truncate">{{ i.label }}</span>
          <span class="font-medium">{{ formatMoney(i.amount) }}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-11 shrink-0" :aria-label="`Actions for ${i.label}`"><PhDotsThree :size="20" weight="bold" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="gap-3" @select="$emit('edit', i)"><PhPencilSimple :size="20" />Change amount</DropdownMenuItem>
            <DropdownMenuItem class="gap-3" @select="$emit('rename', i)"><PhTextAa :size="20" />Rename line</DropdownMenuItem>
            <DropdownMenuItem class="gap-3 text-alert focus:text-alert" @select="$emit('remove', i)"><PhTrash :size="20" />Delete line</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      <li v-if="!items.length && !computedRows?.length" class="flex min-h-14 items-center text-muted-foreground">Nothing here for this month. Add a line to start.</li>
    </ul>
    <p class="mt-3 flex justify-between pr-[52px] font-medium"><span>Total</span><span>{{ formatMoney(total) }}</span></p>
  </section>
</template>
