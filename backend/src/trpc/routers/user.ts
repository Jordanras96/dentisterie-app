import { router, protectedProcedure, adminProcedure, superAdminProcedure } from '../trpc'
import { z } from 'zod'
import { hashPassword, comparePassword } from '../../lib/auth'

export const userRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { id: true, username: true, role: true, permissions: true, isActive: true, createdAt: true },
      orderBy: { username: 'asc' },
    })
  }),

  logs: superAdminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(100), userId: z.number().optional(), module: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = {}
      if (input.userId) where.userId = input.userId
      if (input.module) where.module = input.module

      const [logs, total] = await Promise.all([
        ctx.prisma.userLog.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { user: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.userLog.count({ where }),
      ])

      return { data: logs, total, page: input.page, pages: Math.ceil(total / input.limit) }
    }),

  deletionRequests: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.deletionRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }),

  approveDeletion: adminProcedure
    .input(z.object({ requestId: z.number(), approve: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.prisma.deletionRequest.update({
        where: { id: input.requestId },
        data: {
          status: input.approve ? 'APPROVED' : 'REJECTED',
          approvedBy: ctx.user!.id,
          approvedAt: new Date(),
        },
      })

      if (input.approve) {
        if (request.module === 'patient') {
          await ctx.prisma.patient.delete({ where: { id: parseInt(request.entityId) } })
        }
      }

      return request
    }),

  updatePermissions: adminProcedure
    .input(z.object({ userId: z.number(), permissions: z.any() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { permissions: input.permissions },
      })
    }),

  changePassword: protectedProcedure
    .input(z.object({ oldPassword: z.string(), newPassword: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.user!.id } })
      if (!user) throw new Error('User not found')

      const isValid = await comparePassword(input.oldPassword, user.password)
      if (!isValid) throw new Error('Mot de passe incorrect')

      const hashedPassword = await hashPassword(input.newPassword)
      return ctx.prisma.user.update({
        where: { id: ctx.user!.id },
        data: { password: hashedPassword },
      })
    }),
})
