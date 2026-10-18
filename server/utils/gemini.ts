const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash'

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim())

// Reads a photo with Gemini and returns the JSON it answers with. Gemini reads large photos in tiles, so small print on a receipt survives.
export async function geminiImageJson(opts: { prompt: string; image: string; timeoutMs?: number }): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw createError({ statusCode: 503, statusMessage: 'AI is not set up' })
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(opts.image)
  if (!match) throw createError({ statusCode: 400, statusMessage: 'Bad request' })

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }, { inline_data: { mime_type: match[1], data: match[2] } }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 2000 },
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
    })
  } catch {
    throw createError({ statusCode: 504, statusMessage: 'The AI took too long' })
  }
  if (res.status === 429) throw createError({ statusCode: 429, statusMessage: 'Too many AI requests. Try again in a minute.' })
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: 'The AI could not answer' })

  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw createError({ statusCode: 502, statusMessage: 'The AI gave an unreadable answer' })
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'The AI gave an unreadable answer' })
  }
}
