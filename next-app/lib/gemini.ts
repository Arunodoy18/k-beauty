import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const skinModelName = process.env.GEMINI_SKIN_MODEL ?? 'gemini-2.5-flash-image'
const textModelName = process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.0-flash'

export const skinModel = genAI.getGenerativeModel({
  model: skinModelName,
  generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
})

export const textModel = genAI.getGenerativeModel({
  model: textModelName,
  generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
})

export function getTextModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY')
  }
  return textModel
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY ?? '',
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
    throw new SyntaxError(`AI returned invalid JSON: ${raw.slice(0, 120)}`)
  }
}

export function buildGroqSkinPrompt(city: string, quizAnswers?: object): string {
  return `You are an expert Korean skincare dermatologist 
specializing in Indian skin types. Indian skin has higher 
melanin (prone to PIH), varies by city climate, and has 
different oiliness patterns than East Asian skin.
The user is from ${city}.

${
  quizAnswers
    ? `Quiz answers from user: ${JSON.stringify(quizAnswers, null, 2)}`
    : 'Analyze based on typical Indian skin profile for this city.'
}

Return ONLY raw valid JSON — no markdown, no backticks, 
no explanation. Just the JSON object with this exact schema:
{
  "overallGlowScore": number between 0-100,
  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "concerns": [
    {
      "name": string,
      "score": number (0-100, higher = more concern),
      "severity": "mild" | "moderate" | "high",
      "explanation": string (2 sentences for Indian skin),
      "recommendedIngredient": string
    }
  ],
  "insights": [
    { "finding": string, "explanation": string }
  ],
  "climateNote": string (advice specific to ${city} weather),
  "routineComplexity": "basic" | "intermediate" | "advanced"
}`
}

export async function analyzeWithGroq(city: string, quizAnswers?: object): Promise<unknown> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: buildGroqSkinPrompt(city, quizAnswers),
      },
      {
        role: 'user',
        content: quizAnswers
          ? "Analyze this user's skin from their quiz answers and return the JSON report."
          : `Generate an accurate skin profile for a user from ${city} and return the JSON report.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  return parseGeminiJSON(raw)
}
