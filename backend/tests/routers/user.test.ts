import { describe, it, expect } from 'vitest'
import { createTestCaller, createAnonymousCaller } from '../helpers/trpc'

function createOperatorCaller() {
  return createTestCaller({
    user: {
      id: 99,
      username: 'test_operator',
      role: 'OPERATOR',
      permissions: {},
      isActive: true,
    },
  } as any)
}

describe('user router', () => {
  describe('user.list', () => {
    it('should return list of users for admin', async () => {
      const caller = createTestCaller()
      const result = await caller.user.list()

      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('username')
        expect(result[0]).toHaveProperty('role')
      }
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.user.list()).rejects.toThrow()
    })

    it('should reject operator access (admin only)', async () => {
      const caller = createOperatorCaller()
      await expect(caller.user.list()).rejects.toThrow()
    })
  })

  describe('user.deletionRequests', () => {
    it('should return pending deletion requests for admin', async () => {
      const caller = createTestCaller()
      const result = await caller.user.deletionRequests()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.user.deletionRequests()).rejects.toThrow()
    })
  })

  describe('user.logs', () => {
    it('should return logs for super admin', async () => {
      const caller = createTestCaller()
      const result = await caller.user.logs({ page: 1, limit: 10 })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should reject operator access', async () => {
      const caller = createOperatorCaller()
      await expect(caller.user.logs({ page: 1 })).rejects.toThrow()
    })
  })
})
