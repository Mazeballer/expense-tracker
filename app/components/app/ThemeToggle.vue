<script setup lang="ts">
import { PhCheck, PhDesktop, PhMoon, PhSun } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const colorMode = useColorMode()
const options = [
  { value: 'system', label: 'System', icon: PhDesktop },
  { value: 'light', label: 'Light', icon: PhSun },
  { value: 'dark', label: 'Dark', icon: PhMoon },
] as const
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-11 w-full justify-start gap-3 px-3">
        <PhSun :size="20" />
        Theme
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem v-for="o in options" :key="o.value" class="gap-3" @select="colorMode.preference = o.value">
        <component :is="o.icon" :size="20" />
        {{ o.label }}
        <PhCheck v-if="colorMode.preference === o.value" :size="16" class="ml-auto" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
