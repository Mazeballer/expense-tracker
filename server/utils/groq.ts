type Message = { role: 'system' | 'user'; content: string | unknown[] }

const BASE_URL = process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1'
export const TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? 'openai/gpt-oss-120b'
export const VISION_MODEL = process.env.GROQ_VISION_MODEL ?? 'qwen/qwen3.8-27b'

// Asks the model for JSON and returns the parsed object. Throws a clean HTTP error when anything goes wrong.
export async function groqJson(opts: { model: string; messages: Message[]; maxTokens?: number; lowEffort?: boolean; timeoutMs?: number }): Promise<unknown> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw createError({ statusCode: 503, statusMessage: 'AI is not set up' })

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: 0,
        max_tokens: opts.maxTokens ?? 800,
        response_format: { type: 'json_object' },
        ...(opts.lowEffort ? { reasoning_effort: 'low' } : {}),
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
    })
  } catch {
    throw createError({ statusCode: 504, statusMessage: 'The AI took too long' })
  }
  if (res.status === 429) throw createError({ statusCode: 429, statusMessage: 'Too many AI requests. Try again in a minute.' })
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: 'The AI could not answer' })

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = (body.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '')
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start < 0 || end < start) throw createError({ statusCode: 502, statusMessage: 'The AI gave an unreadable answer' })
  try {
    return JSON.parse(content.slice(start, end + 1))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'The AI gave an unreadable answer' })
  }
}
