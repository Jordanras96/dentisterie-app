import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const factureRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        dateDebut: z.string().optional(),
        dateFin: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, dateDebut, dateFin, search } = input
      const skip = (page - 1) * limit

      const where: any = {}
      if (dateDebut) where.dateVisite = { gte: new Date(dateDebut) }
      if (dateFin) where.dateVisite = { ...where.dateVisite, lte: new Date(dateFin) }
      if (search) {
        where.OR = [
          { numeroOrdre: { contains: search } },
          { nomPatient: { contains: search, mode: 'insensitive' } },
          { numeroPatient: { contains: search, mode: 'insensitive' } },
        ]
      }

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
        include: {
          lignes: { include: { intervention: true, produit: true } },
          patient: true,
        },
      })
    }),

  nextNumeroOrdre: protectedProcedure.query(async ({ ctx }) => {
    const lastFacture = await ctx.prisma.facture.findFirst({
      orderBy: { id: 'desc' },
      select: { numeroOrdre: true },
    })
    const lastNum = parseInt(lastFacture?.numeroOrdre || '0')
    return String(lastNum + 1).padStart(5, '0')
  }),

  create: protectedProcedure
    .input(
      z.object({
        numeroPatient: z.string(),
        dateVisite: z.string(),
        typePatient: z.number().default(1),
        assurance: z.string().optional(),
        typeCas: z.enum(['rendez_vous', 'nouvelle_fiche', 'ancien_cas']).default('nouvelle_fiche'),
        interventions: z.array(
          z.object({
            codeIntervention: z.string(),
            nbr: z.number().default(1),
            medecinId: z.number().optional(),
            assistantId: z.number().optional(),
          })
        ),
        produits: z.array(
          z.object({
            codeProduit: z.string(),
            quantite: z.number().default(1),
          })
        ).default([]),
        tarifType: z.string().default('public'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { numeroPatient: input.numeroPatient },
      })
      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient non trouvé' })
      }

      const lastFacture = await ctx.prisma.facture.findFirst({
        orderBy: { id: 'desc' },
        select: { numeroOrdre: true },
      })
      const nextNumero = String((parseInt(lastFacture?.numeroOrdre || '0') + 1)).padStart(5, '0')

      const tarifField = {
        public: 'prixPublic',
        prise_charge: 'prixPriseCharge',
        tiko: 'prixTiko',
        personnel: 'prixPersonnel',
        retraite: 'prixRetraite',
        enfcd: 'prixEnfcd',
      }[input.tarifType] || 'prixPublic'

      let montantTotal = 0

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

      for (const intv of input.interventions) {
        const intervention = await ctx.prisma.intervention.findUnique({
          where: { codeTravail: intv.codeIntervention },
        })
        if (!intervention) continue

        const prix = Number((intervention as any)[tarifField]) || 0
        const montant = prix * intv.nbr
        montantTotal += montant

        await ctx.prisma.ligneFacture.create({
          data: {
            numeroOrdre: nextNumero,
            codeIntervention: intv.codeIntervention,
            quantite: intv.nbr,
            prixUnitaire: prix,
            montant,
          },
        })

        await ctx.prisma.interventionActivite.create({
          data: {
            numeroOrdre: nextNumero,
            codeIntervention: intv.codeIntervention,
            medecinId: intv.medecinId || null,
            assistantId: intv.assistantId || null,
            nbr: intv.nbr,
          },
        })
      }

      for (const prod of input.produits) {
        const produit = await ctx.prisma.produit.findUnique({
          where: { codeProduit: prod.codeProduit },
        })
        if (!produit) continue

        const prixField = {
          public: 'prixVte',
          prise_charge: 'prixVte',
          tiko: 'prixVte',
          personnel: 'prixPers',
          retraite: 'prixRetraite',
          enfcd: 'prixEnfcd',
        }[input.tarifType] || 'prixVte'

        const prix = Number((produit as any)[prixField]) || 0
        const montant = prix * prod.quantite
        montantTotal += montant

        await ctx.prisma.ligneFacture.create({
          data: {
            numeroOrdre: nextNumero,
            codeProduit: prod.codeProduit,
            quantite: prod.quantite,
            prixUnitaire: prix,
            montant,
          },
        })

        await ctx.prisma.mouvementStock.create({
          data: {
            dateMouvement: new Date(),
            codeProduit: prod.codeProduit,
            typeMouvement: 'S',
            quantite: prod.quantite,
            prixUnitaire: prix,
            reference: nextNumero,
          },
        })
      }

      await ctx.prisma.facture.update({
        where: { numeroOrdre: nextNumero },
        data: { montantTotal },
      })

      await ctx.prisma.patient.update({
        where: { numeroPatient: input.numeroPatient },
        data: { derniereVisite: new Date(input.dateVisite) },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'facture',
          entityType: 'Facture',
          entityId: nextNumero,
          details: {
            numeroPatient: input.numeroPatient,
            nomPatient: patient.nom,
            montantTotal,
            nbInterventions: input.interventions.length,
            nbProduits: input.produits.length,
          },
        },
      })

      return ctx.prisma.facture.findUnique({
        where: { numeroOrdre: nextNumero },
        include: {
          lignes: { include: { intervention: true, produit: true } },
          patient: true,
        },
      })
    }),
})
