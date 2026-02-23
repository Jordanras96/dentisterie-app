/**
 * Business logic utilities for invoice calculations, stock, and cash totals.
 * Extracted from page components for testability.
 */

export type TarifType = 'prixVte' | 'prixPers' | 'prixRetraite' | 'prixEnfcd'

export interface PriceFields {
  prixVte: number | string
  prixPers: number | string
  prixRetraite: number | string
  prixEnfcd: number | string
}

export interface InvoiceLine {
  prix: number
  quantite: number
}

export interface StockLine {
  codeProduit: string
  quantite: number
  prixUnitaire: number
}

/**
 * Map typePatient number to the corresponding price field key.
 */
export function tarifTypeFromPatientType(typePatient: number): TarifType {
  switch (typePatient) {
    case 2:
      return 'prixPers'
    case 3:
      return 'prixRetraite'
    case 4:
      return 'prixEnfcd'
    default:
      return 'prixVte'
  }
}

/**
 * Get the price from a price-fields object based on tarifType.
 */
export function getPriceByTarif(item: PriceFields, tarifType: TarifType): number {
  return Number(item[tarifType]) || 0
}

/**
 * Calculate the total amount for a list of invoice lines.
 */
export function calculateInvoiceTotal(lines: InvoiceLine[]): number {
  return lines.reduce((sum, line) => sum + line.prix * line.quantite, 0)
}

/**
 * Calculate the stock entry total for a list of stock lines.
 */
export function calculateStockEntryTotal(lines: StockLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantite * line.prixUnitaire, 0)
}

/**
 * Format currency amount for display (Malagasy Ariary).
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} Ar`
}

/**
 * Calculate the percentage for stats display.
 */
export function calculatePercentage(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Generate the next sequential code based on existing codes.
 * Used for product/intervention code generation.
 */
export function generateNextCode(prefix: string, existingCodes: string[]): string {
  const matching = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => {
      const suffix = c.slice(prefix.length)
      return parseInt(suffix, 10)
    })
    .filter((n) => !isNaN(n))

  const next = matching.length > 0 ? Math.max(...matching) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
