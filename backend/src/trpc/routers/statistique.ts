import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const statistiqueRouter = router({
  parSexe: protectedProcedure
    .input(z.object({ annee: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = {}
      if (input.annee) {
        const debut = new Date(input.annee, 0, 1)
        const fin = new Date(input.annee + 1, 0, 1)
        where.dateVisite = { gte: debut, lt: fin }
      }

      const factures = await ctx.prisma.facture.findMany({ where, include: { patient: true } })

      const seen = new Set<string>()
      const stats = { M: 0, F: 0, Inconnu: 0 }
      factures.forEach(f => {
        if (seen.has(f.numeroPatient)) return
        seen.add(f.numeroPatient)
        if (f.patient.sexe === 'M') stats.M++
        else if (f.patient.sexe === 'F') stats.F++
        else stats.Inconnu++
      })
      return stats
    }),

  parAge: protectedProcedure
    .input(z.object({ annee: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = {}
      if (input.annee) {
        const debut = new Date(input.annee, 0, 1)
        const fin = new Date(input.annee + 1, 0, 1)
        where.dateVisite = { gte: debut, lt: fin }
      }

      const factures = await ctx.prisma.facture.findMany({ where, include: { patient: true } })

      const seen = new Set<string>()
      const stats = { bebe: 0, enfant: 0, adolescent: 0, adulte: 0, age: 0 }
      
      factures.forEach(f => {
        if (seen.has(f.numeroPatient)) return
        seen.add(f.numeroPatient)
        if (!f.patient.dateNaissance) return
        const age = new Date().getFullYear() - new Date(f.patient.dateNaissance).getFullYear()
        if (age < 2) stats.bebe++
        else if (age < 12) stats.enfant++
        else if (age < 18) stats.adolescent++
        else if (age < 60) stats.adulte++
        else stats.age++
      })
      
      return stats
    }),
})
