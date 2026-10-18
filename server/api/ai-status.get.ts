// Safe check for setup problems: says whether the AI key is visible to this server. It never returns the key itself.
export default defineEventHandler(() => ({
  groqKeySet: Boolean(process.env.GROQ_API_KEY?.trim()),
  env: process.env.VERCEL_ENV ?? 'local',
}))
