import { initTRPC, TRPCError } from '@trpc/server'
import { Context } from './context'
import superjson from 'superjson'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

// Middleware pour vérifier l'authentification
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Non authentifié' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

// Middleware pour vérifier le rôle admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'SUPER_ADMIN' && ctx.user.role !== 'ADMIN')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé - Admin requis' })
  }
  return next({ ctx })
})

// Middleware pour vérifier super admin
const isSuperAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé - Super Admin requis' })
  }
  return next({ ctx })
})

export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)
export const superAdminProcedure = t.procedure.use(isAuthed).use(isSuperAdmin)
