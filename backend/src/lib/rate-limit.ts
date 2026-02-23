/**
 * Simple in-memory rate limiter for the backend.
 * Tracks requests per IP and blocks if threshold exceeded.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const DEFAULT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 100 // 100 requests per minute

export function isRateLimited(
  ip: string,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  if (entry.count > maxRequests) {
    return true
  }

  return false
}

/**
 * Stricter rate limit for auth endpoints (login).
 * 10 attempts per minute per IP.
 */
export function isAuthRateLimited(ip: string): boolean {
  return isRateLimited(`auth:${ip}`, 60 * 1000, 10)
}

/**
 * Clean up expired entries periodically.
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
