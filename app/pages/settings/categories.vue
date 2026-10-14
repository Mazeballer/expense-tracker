<script setup lang="ts">
import { CATEGORY_ICONS } from '~/lib/emoji'

const lookups = useLookups()
const sheet = reactive({ open: false, id: null as string | null })
const rows = computed(() => lookups.categories.value.filter((c) => !c.archived))
const editing = computed(() => lookups.categories.value.find((c) => c.id === sheet.id))
const openSheet = (id: string | null = null) => Object.assign(sheet, { open: true, id })

async function save(name: string, _kind?: string, icon?: string) {
  const id = sheet.id
  const ok = await runSave(() => (id ? lookups.updateCategory(id, { name, icon }) : lookups.addCategory(name, icon)), id ? 'Changes saved' : 'Category added')
  if (ok) sheet.open = false
}
const archive = (id: string) => runSave(() => lookups.updateCategory(id, { archived: true }), 'Archived')
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Categories</PageTitle>
    </div>
    <LookupList title="Categories" hide-title add-label="Add category" :rows="rows" @add="openSheet()" @rename="openSheet($event)" @archive="archive($event)" />

    <ResponsiveSheet v-model:open="sheet.open" :title="sheet.id ? 'Rename' : 'Add category'">
      <NameForm
        v-if="sheet.open"
        label="Name"
        :initial="editing?.name"
        :icons="CATEGORY_ICONS"
        :initial-icon="editing?.icon"
        :submit-label="sheet.id ? 'Save changes' : 'Add category'"
        :on-save="save"
      />
    </ResponsiveSheet>
  </div>
</template>
