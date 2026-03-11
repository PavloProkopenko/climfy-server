import { Hono } from 'hono'
import { createUserClient } from '../lib/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { FavoriteCity } from '../types/index.ts'
import type { AppEnv } from '../types/hono.ts'

const favorites = new Hono<AppEnv>()

favorites.use('/*', authMiddleware)

favorites.get('/', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)

  const { data, error } = await db
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)

  return c.json(data as FavoriteCity[])
})

favorites.post('/', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)
  const body = await c.req.json<Omit<FavoriteCity, 'added_at'>>()

  if (!body.id || !body.city_name || body.lat == null || body.lon == null) {
    return c.json({ error: 'id, city_name, lat, lon are required' }, 400)
  }

  const { data, error } = await db
    .from('favorites')
    .upsert(
      {
        id: body.id,
        user_id: user.id,
        city_name: body.city_name,
        country: body.country,
        state: body.state,
        lat: body.lat,
        lon: body.lon,
      },
      { onConflict: 'id,user_id' },
    )
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  return c.json(data, 201)
})

favorites.delete('/:id', async (c) => {
  const user = c.get('user')!
  const db = createUserClient(c.get('token')!)
  const id = c.req.param('id')

  const { error } = await db
    .from('favorites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ message: 'Removed' })
})

export default favorites
