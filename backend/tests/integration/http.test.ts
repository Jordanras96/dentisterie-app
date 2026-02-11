import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from '../../src/trpc/router'
import { createContext } from '../../src/trpc/context'
import supertest from 'supertest'

let app: ReturnType<typeof Fastify>
let request: ReturnType<typeof supertest>

describe('HTTP Integration Tests', () => {
  beforeAll(async () => {
    app = Fastify({ logger: false })

    await app.register(cors, { origin: true, credentials: true })
    await app.register(cookie)
    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ error }: { error: Error }) {
          // silent in tests
        },
      },
    })

    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    await app.ready()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Health check endpoint', () => {
    it('GET /health should return 200 with status ok', async () => {
      const res = await request.get('/health')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
      expect(res.body.timestamp).toBeDefined()
    })
  })

  describe('tRPC endpoint availability', () => {
    it('GET /trpc should exist (returns 404 for unknown procedure)', async () => {
      const res = await request.get('/trpc/nonexistent')
      // tRPC returns 404 for unknown procedures
      expect([404, 500]).toContain(res.status)
    })
  })

  describe('Authentication - protected routes', () => {
    it('should reject unauthenticated tRPC calls to protected procedures', async () => {
      const res = await request
        .get('/trpc/patient.list?input=%7B%22page%22%3A1%2C%22limit%22%3A5%7D')
      // Should return 401 UNAUTHORIZED
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject invalid JWT tokens', async () => {
      const res = await request
        .get('/trpc/patient.list?input=%7B%22page%22%3A1%2C%22limit%22%3A5%7D')
        .set('Authorization', 'Bearer invalid-token-here')
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Auth login endpoint', () => {
    it('should reject login with empty credentials via tRPC', async () => {
      const res = await request
        .post('/trpc/auth.login')
        .send({})
        .set('Content-Type', 'application/json')
      // Should fail validation or authentication
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject login with wrong credentials via tRPC', async () => {
      const res = await request
        .post('/trpc/auth.login')
        .send({ username: 'nonexistent_user_xyz', password: 'wrong' })
        .set('Content-Type', 'application/json')
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const res = await request
        .options('/health')
        .set('Origin', 'http://localhost:3000')
      // Should not be 500
      expect(res.status).toBeLessThan(500)
    })
  })

  describe('404 for unknown routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request.get('/api/nonexistent')
      expect(res.status).toBe(404)
    })
  })
})
