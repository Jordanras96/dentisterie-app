import { appRouter } from '../../src/trpc/router'
import { prisma } from '../../src/lib/prisma'
import type { Context } from '../../src/trpc/context'

/**
 * Create a tRPC caller with a mocked context for testing.
 * Simulates an authenticated user by default.
 */
export function createTestCaller(overrides: Partial<Context> = {}) {
  const ctx: Context = {
    req: {} as any,
    res: {} as any,
    prisma,
    user: {
      id: 1,
      username: 'dev',
      role: 'SUPER_ADMIN',
      permissions: { all: true, logs: true, delete: true, create: true, update: true, view: true },
      isActive: true,
    },
    ...overrides,
  } as Context

  return appRouter.createCaller(ctx)
}

/**
 * Create a tRPC caller without authentication (anonymous).
 */
export function createAnonymousCaller() {
  return createTestCaller({ user: null })
}

export { prisma }
