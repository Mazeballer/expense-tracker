<script setup lang="ts">
import { methodTone } from '~/lib/methodTone'
import type { Expense } from '~/types'

defineProps<{ expense: Expense; menu?: boolean }>()
defineEmits<{ edit: []; remove: [] }>()
const { categoryName, categoryIcon, methodName, paymentMethods } = useLookups()
const kindOf = (id: string) => paymentMethods.value.find((m) => m.id === id)?.kind
</script>

<template>
  <li class="flex min-h-14 items-center gap-2 border-b border-line last:border-b-0">
    <button type="button" class="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left" @click="$emit('edit')">
      <IconBubble :icon="categoryIcon(expense.categoryId)" />
      <span class="min-w-0 flex-1">
        <span class="block truncate font-medium">{{ expense.description }}</span>
        <span class="flex items-center gap-2 t-caption text-muted-foreground">
          {{ categoryName(expense.categoryId) }}
          <span v-if="expense.paymentMethodId" class="rounded-full px-2 py-0.5 text-xs font-medium" :class="methodTone(kindOf(expense.paymentMethodId)).pill">{{ methodName(expense.paymentMethodId) }}</span>
        </span>
      </span>
    </button>
    <InlineAmount :expense="expense" />
    <ExpenseActions v-if="menu" :expense="expense" @edit="$emit('edit')" @remove="$emit('remove')" />
  </li>
</template>
