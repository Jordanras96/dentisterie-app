import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

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

      const produits = await ctx.prisma.produit.findMany({
        where,
        orderBy: { codeProduit: 'asc' },
      })

      const codes = produits.map((p) => p.codeProduit)
      const cumulAggr = await ctx.prisma.mouvementStock.groupBy({
        by: ['codeProduit'],
        where: { codeProduit: { in: codes }, typeMouvement: 'E' },
        _sum: { quantite: true },
      })
      const cumulMap = new Map(cumulAggr.map((a) => [a.codeProduit, a._sum.quantite || 0]))

      return produits.map((p) => ({
        ...p,
        cumulAppro: cumulMap.get(p.codeProduit) || 0,
      }))
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.produit.findUnique({
        where: { codeProduit: input.code },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        codeProduit: z.string(),
        libelle: z.string(),
        unite: z.string().optional(),
        prixVte: z.number().default(0),
        prixAchat: z.number().default(0),
        prixPers: z.number().default(0),
        prixRetraite: z.number().default(0),
        prixEnfcd: z.number().default(0),
        categorieProduit: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const produit = await ctx.prisma.produit.create({
        data: {
          ...input,
          isParent: false,
        },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'produit',
          entityType: 'Produit',
          entityId: produit.id.toString(),
          details: { codeProduit: produit.codeProduit, libelle: produit.libelle },
        },
      })

      return produit
    }),

  update: protectedProcedure
    .input(
      z.object({
        codeProduit: z.string(),
        libelle: z.string().optional(),
        unite: z.string().optional(),
        prixVte: z.number().optional(),
        prixAchat: z.number().optional(),
        prixPers: z.number().optional(),
        prixRetraite: z.number().optional(),
        prixEnfcd: z.number().optional(),
        categorieProduit: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { codeProduit, ...data } = input

      const existing = await ctx.prisma.produit.findUnique({ where: { codeProduit } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit non trouvé' })
      }

      const produit = await ctx.prisma.produit.update({
        where: { codeProduit },
        data,
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'UPDATE',
          module: 'produit',
          entityType: 'Produit',
          entityId: produit.id.toString(),
          details: data,
        },
      })

      return produit
    }),

  delete: protectedProcedure
    .input(z.object({ codeProduit: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.produit.findUnique({ where: { codeProduit: input.codeProduit } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit non trouvé' })
      }

      if (ctx.user!.role === 'OPERATOR') {
        await ctx.prisma.deletionRequest.create({
          data: {
            userId: ctx.user!.id,
            module: 'produit',
            entityType: 'Produit',
            entityId: existing.id.toString(),
            reason: 'Demande de suppression par opérateur',
          },
        })
        return { success: true, message: 'Demande de suppression envoyée' }
      }

      await ctx.prisma.produit.delete({ where: { codeProduit: input.codeProduit } })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'DELETE',
          module: 'produit',
          entityType: 'Produit',
          entityId: existing.id.toString(),
          details: { codeProduit: existing.codeProduit, libelle: existing.libelle },
        },
      })

      return { success: true, message: 'Produit supprimé' }
    }),

  stockEntry: protectedProcedure
    .input(
      z.object({
        lignes: z.array(
          z.object({
            codeProduit: z.string(),
            quantite: z.number().min(1),
            prixUnitaire: z.number().default(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lastMvt = await ctx.prisma.mouvementStock.findFirst({
        orderBy: { id: 'desc' },
        select: { reference: true },
      })
      const lastNum = parseInt(lastMvt?.reference?.replace('ENT-', '') || '0')
      const reference = `ENT-${String(lastNum + 1).padStart(5, '0')}`

      const results = []
      for (const ligne of input.lignes) {
        const produit = await ctx.prisma.produit.findUnique({
          where: { codeProduit: ligne.codeProduit },
        })
        if (!produit) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Produit ${ligne.codeProduit} non trouvé`,
          })
        }

        const mvt = await ctx.prisma.mouvementStock.create({
          data: {
            dateMouvement: new Date(),
            codeProduit: ligne.codeProduit,
            typeMouvement: 'E',
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            reference,
          },
        })

        await ctx.prisma.produit.update({
          where: { codeProduit: ligne.codeProduit },
          data: { nbrUtil: { increment: 0 } },
        })

        results.push(mvt)
      }

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'stock',
          entityType: 'MouvementStock',
          entityId: reference,
          details: { reference, nbLignes: input.lignes.length },
        },
      })

      return { reference, mouvements: results }
    }),
})
