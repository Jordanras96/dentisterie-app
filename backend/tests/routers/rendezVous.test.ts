import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createTestCaller, createAnonymousCaller, prisma } from '../helpers/trpc'

const TEST_PATIENT_RDV = '__TEST_RDV_PAT__'

describe('rendezVous router', () => {
  beforeAll(async () => {
    await prisma.rendezVous.deleteMany({
      where: { numeroPatient: TEST_PATIENT_RDV },
    })
    await prisma.patient.deleteMany({
      where: { numeroPatient: TEST_PATIENT_RDV },
    })
    await prisma.patient.create({
      data: { numeroPatient: TEST_PATIENT_RDV, nom: 'PATIENT RDV TEST', sexe: 'F' },
    })
  })

  afterAll(async () => {
    await prisma.rendezVous.deleteMany({
      where: { numeroPatient: TEST_PATIENT_RDV },
    })
    await prisma.patient.deleteMany({
      where: { numeroPatient: TEST_PATIENT_RDV },
    })
    await prisma.$disconnect()
  })

  describe('rendezVous.list', () => {
    it('should return list of rendez-vous', async () => {
      const caller = createTestCaller()
      const result = await caller.rendezVous.list({})

      expect(Array.isArray(result)).toBe(true)
    })

    it('should filter by date', async () => {
      const caller = createTestCaller()
      const result = await caller.rendezVous.list({ date: '2025-01-15' })

      expect(Array.isArray(result)).toBe(true)
    })

    it('should reject anonymous access', async () => {
      const caller = createAnonymousCaller()
      await expect(caller.rendezVous.list({})).rejects.toThrow()
    })
  })

  describe('rendezVous.create', () => {
    it('should create a rendez-vous', async () => {
      const caller = createTestCaller()
      const result = await caller.rendezVous.create({
        numeroPatient: TEST_PATIENT_RDV,
        dateRdv: '2025-06-15',
        heureDebut: '2025-06-15T08:00:00',
        heureFin: '2025-06-15T09:00:00',
        motif: 'Test appointment',
      })

      expect(result).toBeDefined()
      expect(result.numeroPatient).toBe(TEST_PATIENT_RDV)
      expect(result.motif).toBe('Test appointment')
    })
  })
})
