import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/context'
import dotenv from 'dotenv'

dotenv.config()

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  routerOptions: {
    maxParamLength: 5000,
  },
})

async function main() {
  // CORS
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Cookies
  await server.register(cookie)

  // tRPC
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }: { path: string | undefined; error: Error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error)
      },
    },
  })

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Start server
  const port = parseInt(process.env.PORT || '4000')
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'

  await server.listen({ port, host })
  console.log(`🚀 Server ready at http://${host}:${port}`)
  console.log(`📡 tRPC endpoint: http://${host}:${port}/trpc`)
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
