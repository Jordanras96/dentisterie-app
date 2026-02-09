import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const rapportRouter = router({
  journalier: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input, ctx }) => {
      const date = new Date(input.date)
      const factures = await ctx.prisma.facture.findMany({
        where: { dateVisite: { gte: date, lt: new Date(date.getTime() + 86400000) } },
        include: { lignes: true },
      })
      const total = factures.reduce((sum, f) => sum + Number(f.montantTotal), 0)
      return { factures, total, date: input.date }
    }),

  mensuel: protectedProcedure
    .input(z.object({ mois: z.number(), annee: z.number() }))
    .query(async ({ input, ctx }) => {
      const debut = new Date(input.annee, input.mois - 1, 1)
      const fin = new Date(input.annee, input.mois, 1)
      const factures = await ctx.prisma.facture.findMany({
        where: { dateVisite: { gte: debut, lt: fin } },
        include: { lignes: true },
      })
      const total = factures.reduce((sum, f) => sum + Number(f.montantTotal), 0)
      return { factures, total, mois: input.mois, annee: input.annee }
    }),

  annuel: protectedProcedure
    .input(z.object({ annee: z.number() }))
    .query(async ({ input, ctx }) => {
      const debut = new Date(input.annee, 0, 1)
      const fin = new Date(input.annee + 1, 0, 1)
      const factures = await ctx.prisma.facture.findMany({
        where: { dateVisite: { gte: debut, lt: fin } },
        include: { lignes: true },
      })
      const total = factures.reduce((sum, f) => sum + Number(f.montantTotal), 0)
      return { factures, total, annee: input.annee }
    }),
})
