import type { Context, Next } from 'hono'
import { getUserFromToken } from '../lib/supabase.ts'
import type { AppEnv } from '../types/hono.ts'

// Attaches `user` and `token` to context if Bearer token is valid.
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const user = await getUserFromToken(token)

  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('user', user)
  c.set('token', token)
  await next()
}

// Optional auth — attaches user and token if valid, continues without error if not.
export async function optionalAuthMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const user = await getUserFromToken(token)
    if (user) {
      c.set('user', user)
      c.set('token', token)
    }
  }
  await next()
}
