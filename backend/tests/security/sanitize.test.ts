import { describe, it, expect } from 'vitest'
import { sanitizeString, hasSQLInjection, validateSafeInput, sanitizeObject } from '../../src/lib/sanitize'

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should escape HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should escape quotes', () => {
      expect(sanitizeString('"test"')).not.toContain('"')
      expect(sanitizeString("'test'")).not.toContain("'")
    })

    it('should not modify safe strings', () => {
      expect(sanitizeString('Hello World 123')).toBe('Hello World 123')
    })

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('')
    })
  })

  describe('hasSQLInjection', () => {
    it('should detect DROP TABLE', () => {
      expect(hasSQLInjection("'; DROP TABLE users;--")).toBe(true)
    })

    it('should detect UNION SELECT', () => {
      expect(hasSQLInjection("UNION SELECT * FROM users")).toBe(true)
    })

    it('should detect OR 1=1', () => {
      expect(hasSQLInjection("1 OR 1=1")).toBe(true)
    })

    it('should detect comment injection', () => {
      expect(hasSQLInjection('value /* comment */')).toBe(true)
    })

    it('should detect double-dash comments', () => {
      expect(hasSQLInjection('value -- comment')).toBe(true)
    })

    it('should allow normal text', () => {
      expect(hasSQLInjection('Jean-Pierre Dupont')).toBe(false)
      expect(hasSQLInjection('Extraction dentaire')).toBe(false)
      expect(hasSQLInjection('123 rue de la Paix')).toBe(false)
    })

    it('should allow medical terms', () => {
      expect(hasSQLInjection('Couronne métallique')).toBe(false)
      expect(hasSQLInjection('Détartrage complet')).toBe(false)
    })
  })

  describe('validateSafeInput', () => {
    it('should return trimmed string for safe input', () => {
      expect(validateSafeInput('  Hello World  ')).toBe('Hello World')
    })

    it('should throw for SQL injection', () => {
      expect(() => validateSafeInput("'; DROP TABLE users;--", 'name')).toThrow(/dangerous/)
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const result = sanitizeObject({
        name: '<script>alert("x")</script>',
        age: 25,
        active: true,
      })
      expect(result.name).not.toContain('<')
      expect(result.age).toBe(25)
      expect(result.active).toBe(true)
    })

    it('should handle nested objects', () => {
      const result = sanitizeObject({
        user: {
          name: '<b>bold</b>',
        },
      })
      expect((result.user as any).name).not.toContain('<')
    })

    it('should handle empty object', () => {
      expect(sanitizeObject({})).toEqual({})
    })
  })
})
