import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { comparePassword, generateToken } from '../../lib/auth'

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
      })

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Identifiants invalides',
        })
      }

      const isValid = await comparePassword(input.password, user.password)
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Identifiants invalides',
        })
      }

      const token = generateToken(user.id, user.username, user.role)

      await ctx.prisma.userLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          module: 'auth',
          entityType: 'user',
          entityId: user.id.toString(),
          details: { username: user.username },
        },
      })

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions,
        },
      }
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null
    }

    return {
      id: ctx.user.id,
      username: ctx.user.username,
      role: ctx.user.role,
      permissions: ctx.user.permissions,
    }
  }),
})
