<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

const settingsApi = useSettings()
const { data, loading, error, reload } = useResource(() => settingsApi.get())

const save = async (s: { savingsGoal: number | null }) => {
  await runSave(() => settingsApi.update(s), 'Changes saved')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <BackLink to="/settings" label="Settings" />
      <PageTitle>Savings goal</PageTitle>
    </div>
    <Skeleton v-if="loading" class="h-40 w-full" aria-hidden="true" />
    <ErrorState v-else-if="error || !data" what="settings" @retry="reload" />
    <div v-else class="max-w-md">
      <SettingsForm :key="String(data.savingsGoal)" :settings="data" :on-save="save" />
    </div>
  </div>
</template>
