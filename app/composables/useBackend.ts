import type { Backend } from '~/lib/backend'
import { mockBackend } from '~/lib/mock/store'
import { supabaseBackend } from '~/lib/supabase/backend'

export function useBackend(): Backend {
  return useRuntimeConfig().public.useMock ? mockBackend : supabaseBackend
}
