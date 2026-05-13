import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in .env.local')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const skinModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
})

export const textModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
})

export function parseGeminiJSON<T = unknown>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new SyntaxError('Gemini returned invalid JSON')
  }
}
