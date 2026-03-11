import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../lib/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { AppEnv } from '../types/hono.ts'

const auth = new Hono<AppEnv>()

auth.post('/register', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })

  if (error) return c.json({ error: error.message }, 400)

  // Sign in immediately after registration to get a token
  const { data: session, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

  if (signInError) return c.json({ error: signInError.message }, 400)

  return c.json(
    {
      user: { id: data.user.id, email: data.user.email },
      access_token: session.session?.access_token,
    },
    201,
  )
})

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error) return c.json({ error: error.message }, 400)

  return c.json({
    user: { id: data.user.id, email: data.user.email },
    access_token: data.session.access_token,
  })
})

auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

export default auth
