import { describe, it, expect } from 'vitest'
import {
  validatePatientForm,
  validateProductForm,
  validateInterventionForm,
  validateRendezVousForm,
  validateLoginForm,
  validatePasswordChangeForm,
  sanitizeInput,
  isSafeInput,
} from '@/lib/validators'

describe('validatePatientForm', () => {
  it('should pass with valid data', () => {
    const result = validatePatientForm({ nom: 'John Doe', sexe: 'M' })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should fail when nom is empty', () => {
    const result = validatePatientForm({ nom: '', sexe: 'M' })
    expect(result.valid).toBe(false)
    expect(result.errors.nom).toBeDefined()
  })

  it('should fail when nom is whitespace only', () => {
    const result = validatePatientForm({ nom: '   ', sexe: 'M' })
    expect(result.valid).toBe(false)
    expect(result.errors.nom).toBeDefined()
  })

  it('should fail when sexe is invalid', () => {
    const result = validatePatientForm({ nom: 'Test', sexe: 'X' })
    expect(result.valid).toBe(false)
    expect(result.errors.sexe).toBeDefined()
  })

  it('should pass when sexe is not provided', () => {
    const result = validatePatientForm({ nom: 'Test' })
    expect(result.valid).toBe(true)
  })

  it('should fail when numeroPatient is empty string', () => {
    const result = validatePatientForm({ nom: 'Test', numeroPatient: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.numeroPatient).toBeDefined()
  })
})

describe('validateProductForm', () => {
  it('should pass with valid data', () => {
    const result = validateProductForm({ codeProduit: 'P001', libelle: 'Test', prixVte: 100 })
    expect(result.valid).toBe(true)
  })

  it('should fail when codeProduit is empty', () => {
    const result = validateProductForm({ codeProduit: '', libelle: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.errors.codeProduit).toBeDefined()
  })

  it('should fail when libelle is empty', () => {
    const result = validateProductForm({ codeProduit: 'P001', libelle: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.libelle).toBeDefined()
  })

  it('should fail when prixVte is negative', () => {
    const result = validateProductForm({ codeProduit: 'P001', libelle: 'Test', prixVte: -100 })
    expect(result.valid).toBe(false)
    expect(result.errors.prixVte).toBeDefined()
  })

  it('should fail when prixAchat is negative', () => {
    const result = validateProductForm({ codeProduit: 'P001', libelle: 'Test', prixAchat: -50 })
    expect(result.valid).toBe(false)
    expect(result.errors.prixAchat).toBeDefined()
  })

  it('should pass when prices are zero', () => {
    const result = validateProductForm({ codeProduit: 'P001', libelle: 'Test', prixVte: 0, prixAchat: 0 })
    expect(result.valid).toBe(true)
  })
})

describe('validateInterventionForm', () => {
  it('should pass with valid data', () => {
    const result = validateInterventionForm({ codeTravail: 'CHI', libelle: 'Chirurgie' })
    expect(result.valid).toBe(true)
  })

  it('should fail when codeTravail is empty', () => {
    const result = validateInterventionForm({ codeTravail: '', libelle: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.errors.codeTravail).toBeDefined()
  })

  it('should fail when libelle is empty', () => {
    const result = validateInterventionForm({ codeTravail: 'CHI', libelle: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.libelle).toBeDefined()
  })
})

describe('validateRendezVousForm', () => {
  it('should pass with valid data', () => {
    const result = validateRendezVousForm({
      numeroPatient: 'P001',
      dateRdv: '2025-01-15',
      heureDebut: '08:00',
      heureFin: '09:00',
    })
    expect(result.valid).toBe(true)
  })

  it('should fail when numeroPatient is empty', () => {
    const result = validateRendezVousForm({
      numeroPatient: '',
      dateRdv: '2025-01-15',
      heureDebut: '08:00',
      heureFin: '09:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.numeroPatient).toBeDefined()
  })

  it('should fail when heureDebut >= heureFin', () => {
    const result = validateRendezVousForm({
      numeroPatient: 'P001',
      dateRdv: '2025-01-15',
      heureDebut: '10:00',
      heureFin: '09:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.heureFin).toBeDefined()
  })

  it('should fail when heureDebut equals heureFin', () => {
    const result = validateRendezVousForm({
      numeroPatient: 'P001',
      dateRdv: '2025-01-15',
      heureDebut: '09:00',
      heureFin: '09:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.heureFin).toBeDefined()
  })

  it('should fail when dateRdv is missing', () => {
    const result = validateRendezVousForm({
      numeroPatient: 'P001',
      dateRdv: '',
      heureDebut: '08:00',
      heureFin: '09:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.dateRdv).toBeDefined()
  })
})

describe('validateLoginForm', () => {
  it('should pass with valid data', () => {
    const result = validateLoginForm({ username: 'admin', password: 'secret' })
    expect(result.valid).toBe(true)
  })

  it('should fail when username is empty', () => {
    const result = validateLoginForm({ username: '', password: 'secret' })
    expect(result.valid).toBe(false)
    expect(result.errors.username).toBeDefined()
  })

  it('should fail when password is empty', () => {
    const result = validateLoginForm({ username: 'admin', password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })

  it('should fail when both are empty', () => {
    const result = validateLoginForm({ username: '', password: '' })
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(2)
  })
})

describe('validatePasswordChangeForm', () => {
  it('should pass with valid data', () => {
    const result = validatePasswordChangeForm({
      oldPassword: 'old123',
      newPassword: 'new1234',
      confirm: 'new1234',
    })
    expect(result.valid).toBe(true)
  })

  it('should fail when passwords do not match', () => {
    const result = validatePasswordChangeForm({
      oldPassword: 'old123',
      newPassword: 'new123',
      confirm: 'different',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.confirm).toBeDefined()
  })

  it('should fail when newPassword is too short', () => {
    const result = validatePasswordChangeForm({
      oldPassword: 'old',
      newPassword: 'ab',
      confirm: 'ab',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.newPassword).toBeDefined()
  })

  it('should fail when oldPassword is missing', () => {
    const result = validatePasswordChangeForm({
      oldPassword: '',
      newPassword: 'new1234',
      confirm: 'new1234',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.oldPassword).toBeDefined()
  })
})

describe('sanitizeInput', () => {
  it('should escape HTML characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<')
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('>')
  })

  it('should escape quotes', () => {
    expect(sanitizeInput('"hello"')).not.toContain('"')
    expect(sanitizeInput("'hello'")).not.toContain("'")
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('should not modify safe strings', () => {
    expect(sanitizeInput('Hello World 123')).toBe('Hello World 123')
  })
})

describe('isSafeInput', () => {
  it('should return true for safe inputs', () => {
    expect(isSafeInput('Hello World')).toBe(true)
    expect(isSafeInput('Jean-Pierre')).toBe(true)
    expect(isSafeInput('123 rue de la Paix')).toBe(true)
  })

  it('should detect SQL injection attempts', () => {
    expect(isSafeInput("'; DROP TABLE users;--")).toBe(false)
    expect(isSafeInput('1 OR 1=1')).toBe(false)
    expect(isSafeInput("UNION SELECT * FROM users")).toBe(false)
  })

  it('should detect comment injection', () => {
    expect(isSafeInput('/* comment */')).toBe(false)
    expect(isSafeInput('value -- comment')).toBe(false)
  })

  it('should allow normal medical terms', () => {
    expect(isSafeInput('Extraction dentaire')).toBe(true)
    expect(isSafeInput('Couronne métallique')).toBe(true)
    expect(isSafeInput('Détartrage complet')).toBe(true)
  })
})
