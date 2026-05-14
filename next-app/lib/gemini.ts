import { GoogleGenerativeAI } from '@google/generative-ai'

let geminiClient: GoogleGenerativeAI | null = null

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey)
  }

  return geminiClient
}

export function getSkinModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
  })
}

export function getTextModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
  })
}

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
