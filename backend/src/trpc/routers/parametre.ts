import { router, protectedProcedure, adminProcedure } from '../trpc'
import { z } from 'zod'

export const parametreRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.parametre.findFirst()
  }),

  update: adminProcedure
    .input(z.object({ nomEtablissement: z.string().optional(), adresse: z.string().optional(), telephone: z.string().optional(), email: z.string().optional(), logo: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.parametre.findFirst()
      if (existing) {
        return ctx.prisma.parametre.update({ where: { id: existing.id }, data: input })
      }
      return ctx.prisma.parametre.create({ data: { nomEtablissement: input.nomEtablissement || 'Hopital', ...input } })
    }),
})
