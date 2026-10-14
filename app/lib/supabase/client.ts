import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (client) return client
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_KEY are not set. Add them to .env (local) or the hosting settings (production).')
  client = createClient(String(supabaseUrl), String(supabaseKey), {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })
  return client
}
