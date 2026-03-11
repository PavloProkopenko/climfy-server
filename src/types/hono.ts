import type { AuthUser } from './index.ts'

// Typed Hono environment shared across all routes and middleware.
// Use `new Hono<AppEnv>()` to enable typed c.get('user') and c.get('token').
export type AppEnv = {
  Variables: {
    user: AuthUser | undefined
    token: string | undefined
  }
}
