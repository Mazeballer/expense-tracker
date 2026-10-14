<script setup lang="ts">
import { PhArchive, PhDotsThree, PhPencilSimple, PhTrendUp } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

defineProps<{ name: string; investment: boolean }>()
defineEmits<{ value: []; rename: []; archive: [] }>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-11 shrink-0" :aria-label="`Actions for ${name}`"><PhDotsThree :size="20" weight="bold" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem v-if="investment" class="gap-3" @select="$emit('value')"><PhTrendUp :size="20" />Update value</DropdownMenuItem>
      <DropdownMenuItem class="gap-3" @select="$emit('rename')"><PhPencilSimple :size="20" />Rename account</DropdownMenuItem>
      <DropdownMenuItem class="gap-3" @select="$emit('archive')"><PhArchive :size="20" />Archive account</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
