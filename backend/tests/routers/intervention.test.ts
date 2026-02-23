import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

const TEST_CODES = {
  parent: 'I9',
  middle: 'I99',
  child: 'I991',
}

describe('intervention router', () => {
  beforeAll(async () => {
    await prisma.intervention.createMany({
      data: [
        { codeTravail: TEST_CODES.parent, libelle: 'Test Parent', isParent: true, isMiddle: false, isChild: false },
        { codeTravail: TEST_CODES.middle, libelle: 'Test Middle', isParent: false, isMiddle: true, isChild: false },
        { codeTravail: TEST_CODES.child, libelle: 'Test Child', isParent: false, isMiddle: false, isChild: true },
      ],
      skipDuplicates: true,
    })
  })

  afterAll(async () => {
    await prisma.intervention.deleteMany({
      where: { codeTravail: { in: Object.values(TEST_CODES) } },
    })
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
      const result = await caller.intervention.tree()

      expect(result).toHaveProperty('tree')
      expect(result).toHaveProperty('orphans')
      expect(Array.isArray(result.tree)).toBe(true)
      expect(result.tree.length).toBeGreaterThan(0)
      for (const parent of result.tree) {
        expect(parent.isParent).toBe(true)
        expect(Array.isArray(parent.children)).toBe(true)
      }
    })
  })

  describe('intervention.getByCode', () => {
    it('should return intervention by code', async () => {
      const caller = createTestCaller()
      const result = await caller.intervention.getByCode({ code: TEST_CODES.child })
      expect(result).not.toBeNull()
      expect(result!.codeTravail).toBe(TEST_CODES.child)
    })

    it('should return null for non-existent code', async () => {
      const caller = createTestCaller()
      const result = await caller.intervention.getByCode({ code: 'NONEXISTENT' })
      expect(result).toBeNull()
    })
  })
})
