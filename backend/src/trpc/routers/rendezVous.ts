import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const rendezVousRouter = router({
  list: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = {}
      if (input.date) {
        const date = new Date(input.date)
        where.dateRdv = { gte: date, lt: new Date(date.getTime() + 86400000) }
      }
      return ctx.prisma.rendezVous.findMany({ where, include: { patient: true, medecin: true }, orderBy: { heureDebut: 'asc' } })
    }),

  create: protectedProcedure
    .input(z.object({ numeroPatient: z.string(), dateRdv: z.string(), heureDebut: z.string(), heureFin: z.string(), medecinId: z.number().optional(), motif: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.rendezVous.create({ data: { ...input, dateRdv: new Date(input.dateRdv), heureDebut: new Date(input.heureDebut), heureFin: new Date(input.heureFin) } })
    }),
})
