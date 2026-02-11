import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

const TEST_PATIENT_NUMERO = '__TEST_FACT_PAT__'

describe('facture router', () => {
  beforeAll(async () => {
    // Clean test data
    await prisma.ligneFacture.deleteMany({
      where: { facture: { numeroPatient: TEST_PATIENT_NUMERO } },
    })
    await prisma.facture.deleteMany({
      where: { numeroPatient: TEST_PATIENT_NUMERO },
    })
    await prisma.patient.deleteMany({
      where: { numeroPatient: TEST_PATIENT_NUMERO },
    })
    // Seed test patient
    await prisma.patient.create({
      data: { numeroPatient: TEST_PATIENT_NUMERO, nom: 'PATIENT FACTURE TEST', sexe: 'M' },
    })
  })

  afterAll(async () => {
    await prisma.ligneFacture.deleteMany({
      where: { facture: { numeroPatient: TEST_PATIENT_NUMERO } },
    })
    await prisma.facture.deleteMany({
      where: { numeroPatient: TEST_PATIENT_NUMERO },
    })
    await prisma.patient.deleteMany({
      where: { numeroPatient: TEST_PATIENT_NUMERO },
    })
    await prisma.$disconnect()
  })

  describe('facture.list', () => {
    it('should return paginated factures', async () => {
      const caller = createTestCaller()
      const result = await caller.facture.list({ page: 1, limit: 10 })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(result).toHaveProperty('pages')
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.facture.list({ page: 1 })).rejects.toThrow()
    })
  })

  describe('facture.nextNumeroOrdre', () => {
    it('should return a padded string', async () => {
      const caller = createTestCaller()
      const result = await caller.facture.nextNumeroOrdre()

      expect(typeof result).toBe('string')
      expect(result.length).toBe(5)
    })
  })

  describe('facture.getByNumero', () => {
    it('should return null for non-existent facture', async () => {
      const caller = createTestCaller()
      const result = await caller.facture.getByNumero({ numeroOrdre: '99999' })

      expect(result).toBeNull()
    })
  })

  describe('facture.create', () => {
    it('should throw for non-existent patient', async () => {
      const caller = createTestCaller()
      await expect(
        caller.facture.create({
          numeroPatient: 'NONEXISTENT_PATIENT_XYZ',
          dateVisite: new Date().toISOString(),
          interventions: [],
          produits: [],
        })
      ).rejects.toThrow(/Patient non trouvé/)
    })
  })
})
