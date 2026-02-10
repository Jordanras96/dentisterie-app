import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const tarifRouter = router({
  listTypes: protectedProcedure.query(async ({ ctx }) => {
    const customs = await ctx.prisma.tarifPersonnalise.findMany({
      where: { isActive: true },
      select: { nomTarif: true },
      distinct: ['nomTarif'],
      orderBy: { nomTarif: 'asc' },
    })

    const standard = [
      { key: 'public', label: 'Public', field: 'prixPublic' },
      { key: 'prise_charge', label: 'Prise en charge', field: 'prixPriseCharge' },
      { key: 'tiko', label: 'TIKO', field: 'prixTiko' },
      { key: 'personnel', label: 'Personnel', field: 'prixPersonnel' },
      { key: 'retraite', label: 'Retraité', field: 'prixRetraite' },
      { key: 'enfcd', label: 'Enf CD', field: 'prixEnfcd' },
    ]

    const customTypes = customs.map((c) => ({
      key: `custom_${c.nomTarif}`,
      label: c.nomTarif,
      field: null,
    }))

    return { standard, custom: customTypes }
  }),

  listInterventionPrices: protectedProcedure.query(async ({ ctx }) => {
    const interventions = await ctx.prisma.intervention.findMany({
      where: { isChild: true },
      orderBy: { codeTravail: 'asc' },
      select: {
        codeTravail: true,
        libelle: true,
        prixPublic: true,
        prixPriseCharge: true,
        prixTiko: true,
        prixPersonnel: true,
        prixRetraite: true,
        prixEnfcd: true,
      },
    })

    return interventions
  }),

  listProduitPrices: protectedProcedure.query(async ({ ctx }) => {
    const produits = await ctx.prisma.produit.findMany({
      where: { isParent: false },
      orderBy: { codeProduit: 'asc' },
      select: {
        codeProduit: true,
        libelle: true,
        prixVte: true,
        prixAchat: true,
        prixPers: true,
        prixRetraite: true,
        prixEnfcd: true,
      },
    })

    return produits
  }),

  updateInterventionPrice: protectedProcedure
    .input(
      z.object({
        codeTravail: z.string(),
        field: z.enum(['prixPublic', 'prixPriseCharge', 'prixTiko', 'prixPersonnel', 'prixRetraite', 'prixEnfcd']),
        value: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const intervention = await ctx.prisma.intervention.update({
        where: { codeTravail: input.codeTravail },
        data: { [input.field]: input.value },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'UPDATE',
          module: 'tarif',
          entityType: 'Intervention',
          entityId: intervention.id.toString(),
          details: { codeTravail: input.codeTravail, field: input.field, value: input.value },
        },
      })

      return intervention
    }),

  updateProduitPrice: protectedProcedure
    .input(
      z.object({
        codeProduit: z.string(),
        field: z.enum(['prixVte', 'prixAchat', 'prixPers', 'prixRetraite', 'prixEnfcd']),
        value: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const produit = await ctx.prisma.produit.update({
        where: { codeProduit: input.codeProduit },
        data: { [input.field]: input.value },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'UPDATE',
          module: 'tarif',
          entityType: 'Produit',
          entityId: produit.id.toString(),
          details: { codeProduit: input.codeProduit, field: input.field, value: input.value },
        },
      })

      return produit
    }),

  addCustomTarif: protectedProcedure
    .input(
      z.object({
        nomTarif: z.string(),
        codeIntervention: z.string(),
        montant: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tarif = await ctx.prisma.tarifPersonnalise.create({
        data: input,
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'tarif',
          entityType: 'TarifPersonnalise',
          entityId: tarif.id.toString(),
          details: input,
        },
      })

      return tarif
    }),

  listCustomTarifs: protectedProcedure
    .input(z.object({ nomTarif: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const where: any = { isActive: true }
      if (input.nomTarif) where.nomTarif = input.nomTarif

      return ctx.prisma.tarifPersonnalise.findMany({
        where,
        orderBy: [{ nomTarif: 'asc' }, { codeIntervention: 'asc' }],
      })
    }),

  deleteCustomTarif: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.tarifPersonnalise.update({
        where: { id: input.id },
        data: { isActive: false },
      })
      return { success: true }
    }),
})
