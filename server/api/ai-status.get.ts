// Safe check for setup problems. It reports names and lengths only, never the key itself.
export default defineEventHandler(() => {
  const raw = process.env.GROQ_API_KEY
  return {
    groqKeySet: Boolean(raw?.trim()),
    groqKeyLength: raw?.length ?? null,
    groqLikeNames: Object.keys(process.env).filter((k) => /groq/i.test(k)),
    supabaseUrlSet: Boolean(process.env.SUPABASE_URL),
    env: process.env.VERCEL_ENV ?? 'local',
  }
})
