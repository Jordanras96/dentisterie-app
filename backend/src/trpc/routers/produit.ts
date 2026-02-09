import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const produitRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(['parent', 'child', 'all']).default('all'),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = {}

      if (input.type === 'parent') where.isParent = true
      else if (input.type === 'child') where.isParent = false

      if (input.search) {
        where.OR = [
          { libelle: { contains: input.search, mode: 'insensitive' } },
          { codeProduit: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      return ctx.prisma.produit.findMany({
        where,
        orderBy: { codeProduit: 'asc' },
      })
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.produit.findUnique({
        where: { codeProduit: input.code },
      })
    }),
})
