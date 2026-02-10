import { describe, it, expect, afterAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

describe('auth router', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('auth.login', () => {
    it('should login with valid credentials', async () => {
      const caller = createAnonymousCaller()
      const result = await caller.auth.login({
        username: 'dev',
        password: 'master!!',
      })

      expect(result).toHaveProperty('token')
      expect(result.token.split('.')).toHaveLength(3)
      expect(result.user.username).toBe('dev')
      expect(result.user.role).toBe('SUPER_ADMIN')
      expect(result.user).toHaveProperty('permissions')
    })

    it('should reject invalid password', async () => {
      const caller = createAnonymousCaller()
      await expect(
        caller.auth.login({ username: 'dev', password: 'wrongpassword' })
      ).rejects.toThrow('Identifiants invalides')
    })

    it('should reject non-existent user', async () => {
      const caller = createAnonymousCaller()
      await expect(
        caller.auth.login({ username: 'nonexistent', password: 'test' })
      ).rejects.toThrow('Identifiants invalides')
    })
  })

  describe('auth.me', () => {
    it('should return user when authenticated', async () => {
      const caller = createTestCaller()
      const me = await caller.auth.me()

      expect(me).not.toBeNull()
      expect(me?.username).toBe('dev')
      expect(me?.role).toBe('SUPER_ADMIN')
    })

    it('should return null when not authenticated', async () => {
      const caller = createAnonymousCaller()
      const me = await caller.auth.me()
      expect(me).toBeNull()
    })
  })
})
