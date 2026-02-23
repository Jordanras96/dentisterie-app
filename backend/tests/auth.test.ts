import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword, generateToken, verifyToken } from '../src/lib/auth'

describe('Auth - hashPassword & comparePassword', () => {
  it('should hash a password and verify it', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)

    const isValid = await comparePassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await hashPassword('correct')
    const isValid = await comparePassword('wrong', hash)
    expect(isValid).toBe(false)
  })

  it('should produce different hashes for same password', async () => {
    const password = 'samePassword'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2) // bcrypt salts
  })
})

describe('Auth - JWT generateToken & verifyToken', () => {
  it('should generate a valid JWT and verify it', () => {
    const token = generateToken(1, 'dev', 'SUPER_ADMIN')
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // JWT has 3 parts

    const decoded = verifyToken(token)
    expect(decoded.userId).toBe(1)
    expect(decoded.username).toBe('dev')
    expect(decoded.role).toBe('SUPER_ADMIN')
  })

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow()
  })

  it('should throw on tampered token', () => {
    const token = generateToken(1, 'dev', 'ADMIN')
    const parts = token.split('.')
    parts[1] = 'tampered'
    expect(() => verifyToken(parts.join('.'))).toThrow()
  })

  it('should encode different roles correctly', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR']
    for (const role of roles) {
      const token = generateToken(99, 'user', role)
      const decoded = verifyToken(token)
      expect(decoded.role).toBe(role)
    }
  })
})
