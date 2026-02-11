import { describe, it, expect } from 'vitest'
import { createTestCaller, createAnonymousCaller } from '../helpers/trpc'

describe('statistique router', () => {
  describe('statistique.parSexe', () => {
    it('should return sex distribution stats', async () => {
      const caller = createTestCaller()
      const result = await caller.statistique.parSexe({ annee: new Date().getFullYear() })

      expect(result).toHaveProperty('M')
      expect(result).toHaveProperty('F')
      expect(result).toHaveProperty('Inconnu')
      expect(typeof result.M).toBe('number')
      expect(typeof result.F).toBe('number')
      expect(typeof result.Inconnu).toBe('number')
    })

    it('should return stats without year filter', async () => {
      const caller = createTestCaller()
      const result = await caller.statistique.parSexe({})

      expect(result).toHaveProperty('M')
      expect(result).toHaveProperty('F')
      expect(result).toHaveProperty('Inconnu')
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.statistique.parSexe({})).rejects.toThrow()
    })
  })

  describe('statistique.parAge', () => {
    it('should return age distribution stats', async () => {
      const caller = createTestCaller()
      const result = await caller.statistique.parAge({ annee: new Date().getFullYear() })

      expect(result).toHaveProperty('bebe')
      expect(result).toHaveProperty('enfant')
      expect(result).toHaveProperty('adolescent')
      expect(result).toHaveProperty('adulte')
      expect(result).toHaveProperty('age')
      expect(typeof result.bebe).toBe('number')
      expect(typeof result.enfant).toBe('number')
    })

    it('should return stats without year filter', async () => {
      const caller = createTestCaller()
      const result = await caller.statistique.parAge({})

      expect(result).toHaveProperty('bebe')
      expect(result).toHaveProperty('enfant')
      expect(result).toHaveProperty('adolescent')
      expect(result).toHaveProperty('adulte')
      expect(result).toHaveProperty('age')
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.statistique.parAge({})).rejects.toThrow()
    })
  })
})
