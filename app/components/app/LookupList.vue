<script setup lang="ts">
import { PhArchive, PhDotsThree, PhPencilSimple, PhPlus } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type Row = { id: string; name: string; caption?: string; icon?: string }
defineProps<{ title: string; rows: Row[]; addLabel: string; hideTitle?: boolean }>()
defineEmits<{ add: []; rename: [id: string]; archive: [id: string] }>()
</script>

<template>
  <section :aria-label="title">
    <div class="mb-1 flex items-center justify-between">
      <h3 class="t-heading" :class="hideTitle && 'sr-only'">{{ title }}</h3>
      <Button variant="ghost" class="h-11 gap-2" @click="$emit('add')"><PhPlus :size="20" />{{ addLabel }}</Button>
    </div>
    <ul class="border-t border-line">
      <li v-for="r in rows" :key="r.id" class="flex min-h-14 items-center gap-3 border-b border-line py-1">
        <IconBubble v-if="r.icon" :icon="r.icon" />
        <span class="min-w-0 flex-1">
          <span class="block truncate">{{ r.name }}</span>
          <span v-if="r.caption" class="t-caption text-muted-foreground">{{ r.caption }}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="size-11 shrink-0" :aria-label="`Actions for ${r.name}`"><PhDotsThree :size="20" weight="bold" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="gap-3" @select="$emit('rename', r.id)"><PhPencilSimple :size="20" />Rename</DropdownMenuItem>
            <DropdownMenuItem class="gap-3" @select="$emit('archive', r.id)"><PhArchive :size="20" />Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>
  </section>
</template>
