import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

const TEST_CODE = '__TEST_PROD_001__'
const TEST_CREATE_CODE = '__TEST_PROD_002__'

describe('produit router', () => {
  beforeAll(async () => {
    await prisma.mouvementStock.deleteMany({
      where: { codeProduit: { in: [TEST_CODE, TEST_CREATE_CODE] } },
    })
    await prisma.produit.deleteMany({
      where: { codeProduit: { in: [TEST_CODE, TEST_CREATE_CODE] } },
    })
    await prisma.produit.create({
      data: {
        codeProduit: TEST_CODE,
        libelle: 'Produit Test Unitaire',
        prixVte: 1000,
        prixAchat: 500,
        prixPers: 800,
        prixRetraite: 700,
        prixEnfcd: 600,
        isParent: false,
      },
    })
  })

  afterAll(async () => {
    await prisma.mouvementStock.deleteMany({
      where: { codeProduit: { in: [TEST_CODE, TEST_CREATE_CODE] } },
    })
    await prisma.userLog.deleteMany({
      where: { entityType: 'Produit', details: { path: ['codeProduit'], equals: TEST_CODE } },
    })
    await prisma.userLog.deleteMany({
      where: { entityType: 'Produit', details: { path: ['codeProduit'], equals: TEST_CREATE_CODE } },
    })
    await prisma.produit.deleteMany({
      where: { codeProduit: { in: [TEST_CODE, TEST_CREATE_CODE] } },
    })
    await prisma.$disconnect()
  })

  describe('produit.list', () => {
    it('should return a list of products', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.list({})

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should filter by search term', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.list({ search: 'Produit Test Unitaire' })

      expect(result.some((p) => p.codeProduit === TEST_CODE)).toBe(true)
    })

    it('should include cumulAppro field', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.list({ search: TEST_CODE })

      const testProd = result.find((p) => p.codeProduit === TEST_CODE)
      expect(testProd).toBeDefined()
      expect(testProd).toHaveProperty('cumulAppro')
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.produit.list({})).rejects.toThrow()
    })
  })

  describe('produit.getByCode', () => {
    it('should return a product by code', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.getByCode({ code: TEST_CODE })

      expect(result).toBeDefined()
      expect(result?.codeProduit).toBe(TEST_CODE)
      expect(result?.libelle).toBe('Produit Test Unitaire')
    })

    it('should return null for non-existent code', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.getByCode({ code: 'NONEXISTENT_PROD_XYZ' })

      expect(result).toBeNull()
    })
  })

  describe('produit.create', () => {
    it('should create a new product', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.create({
        codeProduit: TEST_CREATE_CODE,
        libelle: 'Produit Création Test',
        prixVte: 2000,
        prixAchat: 1000,
      })

      expect(result.codeProduit).toBe(TEST_CREATE_CODE)
      expect(result.libelle).toBe('Produit Création Test')
      expect(Number(result.prixVte)).toBe(2000)
    })

    it('should reject duplicate codeProduit', async () => {
      const caller = createTestCaller()
      await expect(
        caller.produit.create({
          codeProduit: TEST_CODE,
          libelle: 'Duplicate',
        })
      ).rejects.toThrow()
    })
  })

  describe('produit.update', () => {
    it('should update an existing product', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.update({
        codeProduit: TEST_CODE,
        libelle: 'Produit Test Modifié',
        prixVte: 1500,
      })

      expect(result.libelle).toBe('Produit Test Modifié')
      expect(Number(result.prixVte)).toBe(1500)
    })

    it('should throw NOT_FOUND for non-existent product', async () => {
      const caller = createTestCaller()
      await expect(
        caller.produit.update({
          codeProduit: 'NONEXISTENT_XYZ',
          libelle: 'Test',
        })
      ).rejects.toThrow(/non trouvé/)
    })
  })

  describe('produit.delete', () => {
    it('should delete an existing product', async () => {
      const caller = createTestCaller()
      const result = await caller.produit.delete({ codeProduit: TEST_CREATE_CODE })

      expect(result.success).toBe(true)
    })

    it('should throw NOT_FOUND for non-existent product', async () => {
      const caller = createTestCaller()
      await expect(
        caller.produit.delete({ codeProduit: 'NONEXISTENT_XYZ' })
      ).rejects.toThrow(/non trouvé/)
    })
  })
})
