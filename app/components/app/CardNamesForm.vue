<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = defineProps<{ names: string[]; otherNames: string[]; onSave: (names: string[]) => Promise<void> }>()
const online = useOnline()

const list = ref<string[]>([...props.names])
const draft = ref('')
const saving = ref(false)
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function add() {
  const name = draft.value.trim().replace(/\s+/g, ' ')
  if (!name) return
  if (name.length > 80) return void toast.error('Use 80 characters or fewer.')
  if ([...list.value, ...props.otherNames].some((n) => same(n, name))) return void toast.error('That card is already in a list.')
  if (list.value.length >= 20) return void toast.error('You can add up to 20 cards.')
  list.value.push(name)
  draft.value = ''
}
const remove = (name: string) => { list.value = list.value.filter((n) => n !== name) }

async function save() {
  add()
  saving.value = true
  try { await props.onSave([...list.value]) } finally { saving.value = false }
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="save">
    <div class="flex flex-col gap-2">
      <label for="card-name" class="t-secondary font-medium">Card name in Apple Wallet</label>
      <div class="flex gap-2">
        <Input id="card-name" v-model="draft" class="h-11" autocomplete="off" placeholder="Maybank Visa Platinum" @keydown.enter.prevent="add" />
        <Button type="button" class="h-11 shrink-0" :disabled="!draft.trim()" @click="add">Add</Button>
      </div>
      <p class="t-secondary text-muted-foreground">Add as many as you like. A part of the name is enough.</p>
    </div>

    <ul v-if="list.length" class="border-t border-line" aria-label="Cards in this list">
      <li v-for="n in list" :key="n" class="flex min-h-12 items-center gap-3 border-b border-line">
        <span class="min-w-0 flex-1 truncate">{{ n }}</span>
        <Button type="button" variant="ghost" size="icon" class="size-11 shrink-0" :aria-label="`Remove ${n}`" @click="remove(n)"><PhX :size="20" /></Button>
      </li>
    </ul>
    <p v-else class="t-secondary text-muted-foreground">No cards yet.</p>

    <Button type="submit" class="h-11" :disabled="saving || !online">Save changes</Button>
  </form>
</template>
