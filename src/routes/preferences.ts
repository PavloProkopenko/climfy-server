import { Hono } from 'hono'
import { createUserClient } from '../lib/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { UserPreferences } from '../types/index.ts'
import type { AppEnv } from '../types/hono.ts'

const preferences = new Hono<AppEnv>()

preferences.use('/*', authMiddleware)

preferences.get('/', async (c) => {
  const user = c.get('user')!
  const token = c.get('token')!
  const db = createUserClient(token)

  const { data, error } = await db
    .from('user_preferences')
    .select(
      'temperature_unit, language, first_name, age, activity_type, onboarding_completed, updated_at',
    )
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Row does not exist yet — return defaults
    return c.json({
      temperature_unit: 'celsius',
      language: 'en',
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    })
  }

  if (error) return c.json({ error: error.message }, 500)

  return c.json(data as UserPreferences)
})

preferences.put('/', async (c) => {
  const user = c.get('user')!
  const token = c.get('token')!
  const db = createUserClient(token)
  const body = await c.req.json<Partial<UserPreferences>>()

  const allowedUnits = ['celsius', 'fahrenheit']
  if (body.temperature_unit && !allowedUnits.includes(body.temperature_unit)) {
    return c.json({ error: 'Invalid temperature_unit' }, 400)
  }

  const updates: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  if (body.temperature_unit !== undefined) updates.temperature_unit = body.temperature_unit
  if (body.language !== undefined) updates.language = body.language
  if (body.first_name !== undefined) updates.first_name = body.first_name
  if (body.age !== undefined) updates.age = body.age
  if (body.activity_type !== undefined) updates.activity_type = body.activity_type
  if (body.onboarding_completed !== undefined)
    updates.onboarding_completed = body.onboarding_completed

  const { data, error } = await db
    .from('user_preferences')
    .upsert(updates, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  return c.json(data)
})

export default preferences
