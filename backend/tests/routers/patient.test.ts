import { describe, it, expect, afterAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

const TEST_PATIENT_NUMERO = '__TEST_P9999__'

describe('patient router', () => {
  afterAll(async () => {
    // Cleanup test patient
    await prisma.patient.deleteMany({ where: { numeroPatient: TEST_PATIENT_NUMERO } })
    await prisma.$disconnect()
  })

  describe('patient.list', () => {
    it('should return paginated patients', async () => {
      const caller = createTestCaller()
      const result = await caller.patient.list({ page: 1, limit: 5 })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(result).toHaveProperty('pages')
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeLessThanOrEqual(5)
      expect(result.total).toBeGreaterThan(0) // Data migrated from MySQL
    })

    it('should filter by search term', async () => {
      const caller = createTestCaller()
      const result = await caller.patient.list({ page: 1, limit: 10, search: 'RAKOTO' })

      expect(result.data.length).toBeGreaterThanOrEqual(0)
      for (const p of result.data) {
        const matches =
          p.nom.toUpperCase().includes('RAKOTO') ||
          p.numeroPatient.toUpperCase().includes('RAKOTO')
        expect(matches).toBe(true)
      }
    })

    it('should filter by sexe', async () => {
      const caller = createTestCaller()
      const result = await caller.patient.list({ page: 1, limit: 10, sexe: 'F' })

      for (const p of result.data) {
        expect(p.sexe).toBe('F')
      }
    })

    it('should reject unauthenticated access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.patient.list({ page: 1, limit: 5 })).rejects.toThrow('Non authentifié')
    })
  })

  describe('patient.create', () => {
    it('should create a new patient', async () => {
      const caller = createTestCaller()
      const patient = await caller.patient.create({
        numeroPatient: TEST_PATIENT_NUMERO,
        nom: 'TEST UNITAIRE',
        sexe: 'M',
        profession: 'Développeur',
        adresse: 'Test Address',
        telephone: '+261 34 99 999 99',
      })

      expect(patient.numeroPatient).toBe(TEST_PATIENT_NUMERO)
      expect(patient.nom).toBe('TEST UNITAIRE')
      expect(patient.sexe).toBe('M')
    })

    it('should reject duplicate numero_patient', async () => {
      const caller = createTestCaller()
      await expect(
        caller.patient.create({
          numeroPatient: TEST_PATIENT_NUMERO,
          nom: 'DUPLICATE',
        })
      ).rejects.toThrow()
    })
  })

  describe('patient.getByNumero', () => {
    it('should return patient details with factures', async () => {
      const caller = createTestCaller()
      const patient = await caller.patient.getByNumero({ numero: TEST_PATIENT_NUMERO })

      expect(patient.nom).toBe('TEST UNITAIRE')
      expect(patient).toHaveProperty('factures')
      expect(Array.isArray(patient.factures)).toBe(true)
    })

    it('should throw NOT_FOUND for non-existent patient', async () => {
      const caller = createTestCaller()
      await expect(
        caller.patient.getByNumero({ numero: 'NONEXISTENT_999' })
      ).rejects.toThrow('Patient non trouvé')
    })
  })

  describe('patient.update', () => {
    it('should update patient fields', async () => {
      const caller = createTestCaller()
      const updated = await caller.patient.update({
        numero: TEST_PATIENT_NUMERO,
        nom: 'TEST MODIFIE',
        telephone: '+261 32 00 000 00',
      })

      expect(updated.nom).toBe('TEST MODIFIE')
      expect(updated.telephone).toBe('+261 32 00 000 00')
    })
  })

  describe('patient.delete', () => {
    it('should create deletion request for OPERATOR role', async () => {
      const caller = createTestCaller({
        user: {
          id: 4,
          username: 'DT-Operateur',
          role: 'OPERATOR',
          permissions: { delete: false, create: true, update: true, view: true },
          isActive: true,
        },
      } as any)

      const result = await caller.patient.delete({ numero: TEST_PATIENT_NUMERO })
      expect(result.success).toBe(true)
      expect(result.message).toContain('Demande de suppression')

      // Cleanup deletion request
      await prisma.deletionRequest.deleteMany({
        where: { entityId: (await prisma.patient.findUnique({ where: { numeroPatient: TEST_PATIENT_NUMERO } }))!.id.toString() },
      })
    })

    it('should delete patient for SUPER_ADMIN', async () => {
      const caller = createTestCaller()
      const result = await caller.patient.delete({ numero: TEST_PATIENT_NUMERO })
      expect(result.success).toBe(true)
    })
  })
})
