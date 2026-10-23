import type { Backend } from '~/lib/backend'
import { mockBackend } from '~/lib/mock/store'
import { withOfflineCopy } from '~/lib/offlineBackend'
import { supabaseBackend } from '~/lib/supabase/backend'

let offlineReady: Backend | null = null

export function useBackend(): Backend {
  if (useRuntimeConfig().public.useMock) return mockBackend
  const { user } = useAuth()
  return (offlineReady ??= withOfflineCopy(supabaseBackend, () => user.value?.id ?? null))
}
