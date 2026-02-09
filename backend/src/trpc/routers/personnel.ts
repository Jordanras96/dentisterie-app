import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const personnelRouter = router({
  list: protectedProcedure
    .input(z.object({ type: z.enum(['MEDECIN', 'ASSISTANT']).optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = { isActive: true }
      if (input.type) where.type = input.type
      return ctx.prisma.personnel.findMany({ where, orderBy: { nom: 'asc' } })
    }),

  create: protectedProcedure
    .input(z.object({ nom: z.string(), prenom: z.string(), type: z.enum(['MEDECIN', 'ASSISTANT']), specialite: z.string().optional(), telephone: z.string().optional(), email: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.personnel.create({ data: input })
    }),
})
