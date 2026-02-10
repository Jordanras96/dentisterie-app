import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

dotenv.config()

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
})

afterAll(() => {
  // Cleanup if needed
})
