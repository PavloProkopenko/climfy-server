import { Hono } from 'hono'
import { createUserClient } from '../lib/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { SearchHistoryItem } from '../types/index.ts'
import type { AppEnv } from '../types/hono.ts'

const history = new Hono<AppEnv>()

history.use('/*', authMiddleware)

history.get('/', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)

  const { data, error } = await db
    .from('search_history')
    .select('*')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(10)

  if (error) return c.json({ error: error.message }, 500)

  return c.json(data as SearchHistoryItem[])
})

history.post('/', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)
  const body = await c.req.json<Omit<SearchHistoryItem, 'id' | 'searched_at'>>()

  if (!body.city_name || body.lat == null || body.lon == null) {
    return c.json({ error: 'city_name, lat, lon are required' }, 400)
  }

  // Remove duplicate entry for same coordinates before inserting
  await db
    .from('search_history')
    .delete()
    .eq('user_id', user.id)
    .eq('lat', body.lat)
    .eq('lon', body.lon)

  const { data, error } = await db
    .from('search_history')
    .insert({
      user_id: user.id,
      city_name: body.city_name,
      country: body.country,
      state: body.state,
      lat: body.lat,
      lon: body.lon,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Keep only the 10 most recent
  const { data: allRows } = await db
    .from('search_history')
    .select('id')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })

  if (allRows && allRows.length > 10) {
    const toDelete = allRows.slice(10).map((r: { id: string }) => r.id)
    await db.from('search_history').delete().in('id', toDelete)
  }

  return c.json(data, 201)
})

history.delete('/', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)

  const { error } = await db
    .from('search_history')
    .delete()
    .eq('user_id', user.id)

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ message: 'History cleared' })
})

export default history
