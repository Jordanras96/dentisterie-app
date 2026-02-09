import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const factureRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        dateDebut: z.string().optional(),
        dateFin: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, dateDebut, dateFin } = input
      const skip = (page - 1) * limit

      const where: any = {}
      if (dateDebut) where.dateVisite = { gte: new Date(dateDebut) }
      if (dateFin) where.dateVisite = { ...where.dateVisite, lte: new Date(dateFin) }

      const [factures, total] = await Promise.all([
        ctx.prisma.facture.findMany({
          where,
          skip,
          take: limit,
          include: { lignes: true },
          orderBy: { dateVisite: 'desc' },
        }),
        ctx.prisma.facture.count({ where }),
      ])

      return { data: factures, total, page, pages: Math.ceil(total / limit) }
    }),

  getByNumero: protectedProcedure
    .input(z.object({ numeroOrdre: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.facture.findUnique({
        where: { numeroOrdre: input.numeroOrdre },
        include: { lignes: { include: { intervention: true, produit: true } } },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        numeroPatient: z.string(),
        dateVisite: z.string(),
        typePatient: z.number().default(1),
        assurance: z.string().optional(),
        lignes: z.array(
          z.object({
            code: z.string(),
            quantite: z.number().default(1),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { numeroPatient: input.numeroPatient },
      })

      if (!patient) throw new Error('Patient non trouvé')

      const lastFacture = await ctx.prisma.facture.findFirst({
        orderBy: { numeroOrdre: 'desc' },
      })

      const nextNumero = String((parseInt(lastFacture?.numeroOrdre || '0') + 1)).padStart(5, '0')

      const facture = await ctx.prisma.facture.create({
        data: {
          numeroOrdre: nextNumero,
          numeroPatient: input.numeroPatient,
          nomPatient: patient.nom,
          dateVisite: new Date(input.dateVisite),
          typePatient: input.typePatient,
          assurance: input.assurance,
        },
      })

      for (const ligne of input.lignes) {
        const isIntervention = ligne.code.startsWith('I')
        const codeClean = ligne.code.replace(/^[IP]/, '')

        await ctx.prisma.ligneFacture.create({
          data: {
            numeroOrdre: nextNumero,
            codeIntervention: isIntervention ? ligne.code : null,
            codeProduit: !isIntervention ? ligne.code : null,
            quantite: ligne.quantite,
          },
        })
      }

      await ctx.prisma.patient.update({
        where: { numeroPatient: input.numeroPatient },
        data: { derniereVisite: new Date(input.dateVisite) },
      })

      return facture
    }),
})
