import { describe, it, expect, afterAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

describe('intervention router', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('intervention.list', () => {
    it('should return all interventions', async () => {
      const caller = createTestCaller()
      const result = await caller.intervention.list({})

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should filter by type parent', async () => {
      const caller = createTestCaller()
      const parents = await caller.intervention.list({ type: 'parent' })

      expect(Array.isArray(parents)).toBe(true)
      for (const p of parents) {
        expect(p.isParent).toBe(true)
      }
    })

    it('should filter by type child', async () => {
      const caller = createTestCaller()
      const children = await caller.intervention.list({ type: 'child' })

      expect(Array.isArray(children)).toBe(true)
      for (const c of children) {
        expect(c.isChild).toBe(true)
      }
    })

    it('should reject unauthenticated access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.intervention.list({})).rejects.toThrow('Non authentifié')
    })
  })

  describe('intervention.tree', () => {
    it('should return hierarchical tree structure', async () => {
      const caller = createTestCaller()
      const tree = await caller.intervention.tree()

      expect(Array.isArray(tree)).toBe(true)
      expect(tree.length).toBeGreaterThan(0)
      // Each parent should have children array
      for (const parent of tree) {
        expect(parent.isParent).toBe(true)
        expect(Array.isArray(parent.children)).toBe(true)
      }
    })
  })

  describe('intervention.getByCode', () => {
    it('should return intervention by code', async () => {
      const caller = createTestCaller()
      // Use a code from migrated data
      const all = await caller.intervention.list({ type: 'child' })
      if (all.length > 0) {
        const result = await caller.intervention.getByCode({ code: all[0].codeTravail })
        expect(result).not.toBeNull()
        expect(result!.codeTravail).toBe(all[0].codeTravail)
      }
    })

    it('should return null for non-existent code', async () => {
      const caller = createTestCaller()
      const result = await caller.intervention.getByCode({ code: 'NONEXISTENT' })
      expect(result).toBeNull()
    })
  })
})
