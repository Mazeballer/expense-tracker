import type { H3Event } from 'h3'

const hits = new Map<string, number[]>()
const LIMIT = 30
const WINDOW_MS = 60_000

// Only signed-in people may use the AI (it costs quota), and each person is limited per minute.
export async function requireUser(event: H3Event): Promise<string> {
  const token = getHeader(event, 'authorization')
  const { supabaseUrl, supabaseKey } = useRuntimeConfig(event).public
  if (!token?.startsWith('Bearer ') || !supabaseUrl || !supabaseKey) throw createError({ statusCode: 401, statusMessage: 'Sign in first' })

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: String(supabaseKey), Authorization: token } }).catch(() => null)
  if (!res?.ok) throw createError({ statusCode: 401, statusMessage: 'Sign in first' })
  const user = (await res.json()) as { id?: string }
  if (!user.id) throw createError({ statusCode: 401, statusMessage: 'Sign in first' })

  const now = Date.now()
  const recent = (hits.get(user.id) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMIT) throw createError({ statusCode: 429, statusMessage: 'Too many requests. Try again in a minute.' })
  hits.set(user.id, [...recent, now])
  return user.id
}
