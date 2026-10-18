import { supabase } from '~/lib/supabase/client'

// Calls our own server routes (/api/...), which hold the AI key. The person's sign-in proves who is asking.
export function useAi() {
  return {
    async post<T>(path: string, body: Record<string, unknown>, timeout = 20000): Promise<T> {
      const { data } = await supabase().auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Not signed in')
      return $fetch(path as string, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` }, timeout }) as Promise<T>
    },
  }
}
