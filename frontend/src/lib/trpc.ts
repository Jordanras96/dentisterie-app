import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../backend/src/trpc/router'

const getToken = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('token') || ''
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/trpc',
      headers() {
        const token = getToken()
        return token ? { authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
  transformer: superjson,
})

export type { AppRouter }
