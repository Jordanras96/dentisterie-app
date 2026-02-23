import { describe, it, expect } from 'vitest'
import { isRateLimited, isAuthRateLimited, cleanupRateLimitStore } from '../../src/lib/rate-limit'

describe('Rate Limiting', () => {
  describe('isRateLimited', () => {
    it('should allow first request', () => {
      expect(isRateLimited('test-ip-1')).toBe(false)
    })

    it('should allow requests within limit', () => {
      const ip = 'test-ip-allow-' + Date.now()
      for (let i = 0; i < 5; i++) {
        expect(isRateLimited(ip, 60000, 10)).toBe(false)
      }
    })

    it('should block requests exceeding limit', () => {
      const ip = 'test-ip-block-' + Date.now()
      for (let i = 0; i < 5; i++) {
        isRateLimited(ip, 60000, 5)
      }
      // 6th request should be blocked
      expect(isRateLimited(ip, 60000, 5)).toBe(true)
    })

    it('should reset after window expires', () => {
      const ip = 'test-ip-reset-' + Date.now()
      // Window of 1ms
      for (let i = 0; i < 3; i++) {
        isRateLimited(ip, 1, 2)
      }
      // Wait for reset
      const start = Date.now()
      while (Date.now() - start < 5) { /* busy wait */ }
      expect(isRateLimited(ip, 1, 2)).toBe(false)
    })
  })

  describe('isAuthRateLimited', () => {
    it('should allow first auth attempt', () => {
      const ip = 'auth-test-' + Date.now()
      expect(isAuthRateLimited(ip)).toBe(false)
    })

    it('should block after 10 auth attempts', () => {
      const ip = 'auth-block-' + Date.now()
      for (let i = 0; i < 10; i++) {
        isAuthRateLimited(ip)
      }
      expect(isAuthRateLimited(ip)).toBe(true)
    })
  })

  describe('cleanupRateLimitStore', () => {
    it('should not throw when cleaning up', () => {
      expect(() => cleanupRateLimitStore()).not.toThrow()
    })
  })
})
