/**
 * Input sanitization utilities to prevent injection attacks.
 */

/**
 * Strip dangerous characters from string input.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Check if a string contains potential SQL injection patterns.
 */
export function hasSQLInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\b\s+'[^']*'\s*=\s*'[^']*')/i,
  ]
  return patterns.some((p) => p.test(input))
}

/**
 * Validate that an input string is safe for database use.
 * Returns the sanitized string or throws if injection detected.
 */
export function validateSafeInput(input: string, fieldName: string = 'input'): string {
  if (hasSQLInjection(input)) {
    throw new Error(`Input "${fieldName}" contains potentially dangerous content`)
  }
  return input.trim()
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    const value = result[key]
    if (typeof value === 'string') {
      ;(result as Record<string, unknown>)[key] = sanitizeString(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      ;(result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>)
    }
  }
  return result
}
