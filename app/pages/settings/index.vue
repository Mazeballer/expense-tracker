<script setup lang="ts">
import { PhCreditCard, PhDownloadSimple, PhListBullets, PhSignOut, PhUserFocus, PhTarget, PhWallet } from '@phosphor-icons/vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { currentMonth } from '~/lib/date'
import { epfRateAt, planSummary } from '~/lib/finance'
import { formatMoney } from '~/lib/format'

const planApi = usePlan()
const settingsApi = useSettings()
const lookups = useLookups()
const colorMode = useColorMode()
const exportAll = useExportAll()
const { signOut } = useAuth()
const lock = useAppLock()

const { data } = useResource(async () => {
  const [items, settings] = await Promise.all([planApi.all(), settingsApi.get()])
  return { items, settings }
})

const available = computed(() => (data.value ? formatMoney(planSummary(data.value.items, epfRateAt(data.value.settings.epfRates, currentMonth()), currentMonth()).afterFixed) : ''))
const goal = computed(() => (data.value ? (data.value.settings.savingsGoal === null ? 'Not set' : formatMoney(data.value.settings.savingsGoal)) : ''))
const categoryCount = computed(() => String(lookups.categories.value.filter((c) => !c.archived).length))
</script>

<template>
  <div class="flex max-w-xl flex-col gap-6">
    <PageTitle>Settings</PageTitle>

    <ProfileCard />

    <SettingsGroup title="Money">
      <SettingsRow label="Income and costs" :icon="PhWallet" :value="available" to="/settings/income" />
      <SettingsRow label="Savings goal" :icon="PhTarget" :value="goal" to="/settings/goals" />
    </SettingsGroup>

    <SettingsGroup title="Organize">
      <SettingsRow label="Categories" :icon="PhListBullets" :value="categoryCount" to="/settings/categories" />
    </SettingsGroup>

    <SettingsGroup title="Automation">
      <SettingsRow label="Apple Pay auto-log" :icon="PhCreditCard" to="/settings/apple-pay" />
    </SettingsGroup>

    <SettingsGroup title="App">
      <li class="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span>Appearance</span>
        <Tabs v-model="colorMode.preference" class="w-56">
          <TabsList class="grid h-10 w-full grid-cols-3">
            <TabsTrigger value="system" class="h-8">Auto</TabsTrigger>
            <TabsTrigger value="light" class="h-8">Light</TabsTrigger>
            <TabsTrigger value="dark" class="h-8">Dark</TabsTrigger>
          </TabsList>
        </Tabs>
      </li>
      <SettingsRow label="Face ID" :icon="PhUserFocus" :value="lock.enabled.value ? 'On' : 'Off'" to="/settings/app-lock" />
      <SettingsRow label="Export all data" :icon="PhDownloadSimple" @click="exportAll" />
    </SettingsGroup>

    <SettingsGroup>
      <SettingsRow label="Sign out" :icon="PhSignOut" danger @click="signOut" />
    </SettingsGroup>
  </div>
</template>
