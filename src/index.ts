import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AppEnv } from './types/hono.ts'

import auth from './routes/auth.ts'
import recommendations from './routes/recommendations.ts'
import favorites from './routes/favorites.ts'
import history from './routes/history.ts'
import preferences from './routes/preferences.ts'

const app = new Hono<AppEnv>()

// CORS — allow frontend origin(s)
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/auth', auth)
app.route('/recommendations', recommendations)
app.route('/favorites', favorites)
app.route('/history', history)
app.route('/preferences', preferences)

const port = parseInt(process.env.PORT ?? '3001')

serve({ fetch: app.fetch, port }, () => {
  console.log(`climfy-server running on http://localhost:${port}`)
})
