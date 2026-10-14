<script setup lang="ts">
import { PhDotsThree, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Expense } from '~/types'

defineProps<{ expense: Expense }>()
defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-11" :aria-label="`Actions for ${expense.description}`">
        <PhDotsThree :size="20" weight="bold" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem class="gap-3" @select="$emit('edit')"><PhPencilSimple :size="20" />Edit expense</DropdownMenuItem>
      <DropdownMenuItem class="gap-3 text-alert focus:text-alert" @select="$emit('remove')"><PhTrash :size="20" />Delete expense</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
