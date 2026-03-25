import Anthropic from '@anthropic-ai/sdk'
import type { WeatherSnapshot } from '../types/index.ts'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  ua: 'Ukrainian',
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function getTimeOfDay(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'sedentary (office/studying)',
  light: 'light (casual walks, cycling)',
  active: 'active (gym, hiking)',
  athletic: 'athletic (sports, intensive training)',
}

export async function generateAIRecommendation(params: {
  weather: WeatherSnapshot
  cityName: string
  country: string
  language: string
  topCities: string[]
  userProfile: { firstName?: string; age?: number; activityType?: string }
}): Promise<string> {
  const { weather, cityName, country, language, topCities, userProfile } = params
  const now = new Date()
  const season = getSeason(now.getMonth() + 1)
  const timeOfDay = getTimeOfDay(now.getHours())
  const langName = LANGUAGE_NAMES[language] ?? 'English'

  const locationLabel = country ? `${cityName}, ${country}` : cityName
  const activityLabel = ACTIVITY_LABELS[userProfile.activityType ?? ''] ?? userProfile.activityType ?? 'general'
  const ageInfo = userProfile.age ? ` (${userProfile.age} years old)` : ''
  const citiesInfo =
    topCities.length > 0
      ? `\n- Frequently checks weather in: ${topCities.join(', ')}`
      : ''

  const prompt = `You are a personal weather advisor. Write a warm, personalized recommendation for ${userProfile.firstName ?? 'the user'}.

Current conditions in ${locationLabel}:
- Temperature: ${weather.temp}°C (feels like ${weather.feels_like}°C)
- Weather: ${weather.description}
- Humidity: ${weather.humidity}%
- Wind speed: ${weather.wind_speed} m/s
- Time of day: ${timeOfDay}, ${season}

User profile:
- Name: ${userProfile.firstName ?? 'unknown'}${ageInfo}
- Lifestyle: ${activityLabel}${citiesInfo}

Requirements:
- Open with the user's first name (e.g. "${userProfile.firstName}," or "Hi ${userProfile.firstName},")
- Write at least 3 complete sentences
- Tailor the advice specifically to a ${activityLabel} lifestyle — mention concrete activity-relevant tips
- Reference the local context of ${country || cityName} and the current ${season} season
- Cover clothing/gear and any activity or health tips relevant to conditions
- Do NOT use markdown — no headings, no bullet points, no bold or italic text. Plain text only.

Respond in ${langName} only.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  const text = block.text.trim()
  if (!text) {
    throw new Error('Claude returned empty response text')
  }
  return text
}
