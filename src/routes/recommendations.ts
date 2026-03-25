import { Hono } from 'hono'
import { createUserClient } from '../lib/supabase.ts'
import { generateAIRecommendation } from '../lib/claude.ts'
import { getRuleBasedRecommendation } from '../lib/recommendations.ts'
import { optionalAuthMiddleware } from '../middleware/auth.ts'
import type { WeatherSnapshot } from '../types/index.ts'
import type { AppEnv } from '../types/hono.ts'

const recommendations = new Hono<AppEnv>()

recommendations.get('/', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')

  const lat = parseFloat(c.req.query('lat') ?? '')
  const lon = parseFloat(c.req.query('lon') ?? '')
  const lang = (c.req.query('lang') ?? 'en') as 'en' | 'de' | 'ua'
  const temp = parseFloat(c.req.query('temp') ?? '0')
  const feelsLike = parseFloat(c.req.query('feels_like') ?? '0')
  const humidity = parseInt(c.req.query('humidity') ?? '50')
  const windSpeed = parseFloat(c.req.query('wind_speed') ?? '0')
  const description = c.req.query('description') ?? ''
  const icon = c.req.query('icon') ?? ''
  const cityName = c.req.query('city') ?? 'your city'
  const country = c.req.query('country') ?? ''

  if (isNaN(lat) || isNaN(lon)) {
    return c.json({ error: 'lat and lon query params are required' }, 400)
  }

  const weather: WeatherSnapshot = {
    temp,
    feels_like: feelsLike,
    humidity,
    wind_speed: windSpeed,
    description,
    icon,
  }

  const now = new Date()
  const expires = new Date(now.getTime() + 60 * 60 * 1000) // +1 hour

  // Anonymous users → rule-based, no caching
  if (!user) {
    const content = getRuleBasedRecommendation({
      ...weather,
      hour: now.getHours(),
      language: lang,
    })
    return c.json({
      content,
      is_ai: false,
      generated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      cached: false,
    })
  }

  const db = createUserClient(c.get('token')!)

  // Fetch user profile + top cities in parallel
  const [{ data: prefsRow }, { data: historyRows }] = await Promise.all([
    db
      .from('user_preferences')
      .select('first_name, age, activity_type, onboarding_completed')
      .eq('user_id', user.id)
      .single(),
    db
      .from('search_history')
      .select('city_name')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(20),
  ])

  const topCities = [
    ...new Set((historyRows ?? []).map((r: { city_name: string }) => r.city_name)),
  ].slice(0, 3)

  // Don't generate until onboarding is complete — profile is incomplete
  if (!prefsRow?.onboarding_completed) {
    return c.json({ error: 'Onboarding not completed' }, 403)
  }

  // Check cache only after confirming the user is fully onboarded
  const { data: cached } = await db
    .from('recommendations')
    .select('content, is_ai, generated_at, expires_at')
    .eq('user_id', user.id)
    .eq('language', lang)
    .gt('expires_at', now.toISOString())
    .not('content', 'is', null)
    .neq('content', '')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    return c.json({ ...cached, cached: true })
  }

  const userProfile = {
    firstName: prefsRow.first_name ?? undefined,
    age: prefsRow.age ?? undefined,
    activityType: prefsRow.activity_type ?? undefined,
  }

  // Generate AI recommendation
  let content: string
  let isAI = true

  try {
    content = await generateAIRecommendation({
      weather,
      cityName,
      country,
      language: lang,
      topCities,
      userProfile,
    })
  } catch (err) {
    console.error('[recommendations] Claude generation failed:', err)
    // Fallback to rule-based if Claude fails
    content = getRuleBasedRecommendation({
      ...weather,
      hour: now.getHours(),
      language: lang,
    })
    isAI = false
  }

  // Persist to cache (only if content is non-empty)
  if (content) await db.from('recommendations').insert({
    user_id: user.id,
    lat,
    lon,
    language: lang,
    weather_snapshot: weather,
    content,
    is_ai: isAI,
    generated_at: now.toISOString(),
    expires_at: expires.toISOString(),
  })

  return c.json({
    content,
    is_ai: isAI,
    generated_at: now.toISOString(),
    expires_at: expires.toISOString(),
    cached: false,
  })
})

// Invalidate the recommendation cache for the current user
recommendations.delete('/', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const db = createUserClient(c.get('token')!)
  await db.from('recommendations').delete().eq('user_id', user.id)

  return c.json({ message: 'Cache cleared' })
})

export default recommendations
