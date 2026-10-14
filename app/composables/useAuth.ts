import type { Session } from '@supabase/supabase-js'
import { supabase } from '~/lib/supabase/client'

let started: Promise<void> | null = null

export function useAuth() {
  if (useRuntimeConfig().public.useMock) {
    const signedIn = useLocalStorage<boolean>('mock-signed-in', false)

    async function signIn() {
      await new Promise((resolve) => setTimeout(resolve, 600))
      signedIn.value = true
      await navigateTo('/')
    }

    async function signOut() {
      signedIn.value = false
      localStorage.removeItem('app-lock')
      await navigateTo('/login')
    }

    return { signedIn, signIn, signOut, ready: async () => {}, user: computed(() => null) }
  }

  const session = useState<Session | null>('auth-session', () => null)
  const signedIn = computed(() => session.value !== null)
  const user = computed(() => session.value?.user ?? null)

  // Resolves once the saved session is read. When Google sends the person back with a code in the address, this also finishes that sign-in.
  const ready = () => (started ??= (async () => {
    const sb = supabase()
    const { data } = await sb.auth.getSession()
    session.value = data.session
    sb.auth.onAuthStateChange((_event, next) => { session.value = next })
  })())

  async function signIn() {
    const { error } = await supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase().auth.signOut()
    localStorage.removeItem('app-lock')
    window.location.assign('/login')
  }

  return { signedIn, signIn, signOut, ready, user }
}
