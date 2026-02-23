import { describe, it, expect } from 'vitest'
import {
  tarifTypeFromPatientType,
  getPriceByTarif,
  calculateInvoiceTotal,
  calculateStockEntryTotal,
  formatCurrency,
  calculatePercentage,
  generateNextCode,
} from '@/lib/invoice-utils'

describe('tarifTypeFromPatientType', () => {
  it('should return prixVte for type 1 (Public)', () => {
    expect(tarifTypeFromPatientType(1)).toBe('prixVte')
  })

  it('should return prixPers for type 2 (Personnel)', () => {
    expect(tarifTypeFromPatientType(2)).toBe('prixPers')
  })

  it('should return prixRetraite for type 3 (Retraité)', () => {
    expect(tarifTypeFromPatientType(3)).toBe('prixRetraite')
  })

  it('should return prixEnfcd for type 4 (TIKO/Enfant CD)', () => {
    expect(tarifTypeFromPatientType(4)).toBe('prixEnfcd')
  })

  it('should return prixVte for unknown types', () => {
    expect(tarifTypeFromPatientType(0)).toBe('prixVte')
    expect(tarifTypeFromPatientType(99)).toBe('prixVte')
  })
})

describe('getPriceByTarif', () => {
  const item = {
    prixVte: 10000,
    prixPers: 5000,
    prixRetraite: 7000,
    prixEnfcd: 3000,
  }

  it('should return the correct price for each tarif type', () => {
    expect(getPriceByTarif(item, 'prixVte')).toBe(10000)
    expect(getPriceByTarif(item, 'prixPers')).toBe(5000)
    expect(getPriceByTarif(item, 'prixRetraite')).toBe(7000)
    expect(getPriceByTarif(item, 'prixEnfcd')).toBe(3000)
  })

  it('should handle string prices (from DB)', () => {
    const stringItem = {
      prixVte: '10000',
      prixPers: '5000',
      prixRetraite: '7000',
      prixEnfcd: '3000',
    }
    expect(getPriceByTarif(stringItem, 'prixVte')).toBe(10000)
  })

  it('should return 0 for NaN values', () => {
    const badItem = {
      prixVte: 'abc',
      prixPers: 0,
      prixRetraite: '',
      prixEnfcd: null as unknown as number,
    }
    expect(getPriceByTarif(badItem, 'prixVte')).toBe(0)
    expect(getPriceByTarif(badItem, 'prixPers')).toBe(0)
    expect(getPriceByTarif(badItem, 'prixRetraite')).toBe(0)
    expect(getPriceByTarif(badItem, 'prixEnfcd')).toBe(0)
  })
})

describe('calculateInvoiceTotal', () => {
  it('should calculate the total of invoice lines', () => {
    const lines = [
      { prix: 1000, quantite: 2 },
      { prix: 500, quantite: 3 },
    ]
    expect(calculateInvoiceTotal(lines)).toBe(3500)
  })

  it('should return 0 for empty lines', () => {
    expect(calculateInvoiceTotal([])).toBe(0)
  })

  it('should handle single line', () => {
    expect(calculateInvoiceTotal([{ prix: 2500, quantite: 1 }])).toBe(2500)
  })

  it('should handle zero quantities', () => {
    expect(calculateInvoiceTotal([{ prix: 1000, quantite: 0 }])).toBe(0)
  })

  it('should handle zero prices', () => {
    expect(calculateInvoiceTotal([{ prix: 0, quantite: 5 }])).toBe(0)
  })
})

describe('calculateStockEntryTotal', () => {
  it('should calculate stock entry total', () => {
    const lines = [
      { codeProduit: 'P001', quantite: 10, prixUnitaire: 500 },
      { codeProduit: 'P002', quantite: 5, prixUnitaire: 1200 },
    ]
    expect(calculateStockEntryTotal(lines)).toBe(11000)
  })

  it('should return 0 for empty stock lines', () => {
    expect(calculateStockEntryTotal([])).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('should format amount with Ar suffix', () => {
    const result = formatCurrency(10000)
    expect(result).toContain('Ar')
    expect(result).toContain('10')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('0 Ar')
  })
})

describe('calculatePercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25)
    expect(calculatePercentage(1, 3)).toBe(33)
  })

  it('should return 0 when total is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0)
  })

  it('should return 0 when total is negative', () => {
    expect(calculatePercentage(10, -5)).toBe(0)
  })

  it('should return 100 when value equals total', () => {
    expect(calculatePercentage(50, 50)).toBe(100)
  })
})

describe('generateNextCode', () => {
  it('should generate first code with 001 suffix', () => {
    expect(generateNextCode('CHI', [])).toBe('CHI001')
  })

  it('should increment from existing codes', () => {
    expect(generateNextCode('CHI', ['CHI001', 'CHI002'])).toBe('CHI003')
  })

  it('should ignore codes with different prefix', () => {
    expect(generateNextCode('PRO', ['CHI001', 'PRO005'])).toBe('PRO006')
  })

  it('should handle non-sequential codes', () => {
    expect(generateNextCode('X', ['X001', 'X010', 'X003'])).toBe('X011')
  })

  it('should handle codes with non-numeric suffixes gracefully', () => {
    expect(generateNextCode('A', ['Aabc', 'A001'])).toBe('A002')
  })
})
