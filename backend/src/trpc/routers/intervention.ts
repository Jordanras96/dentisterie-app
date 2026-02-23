import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

function classifyCode(code: string) {
  const numeric = code.replace(/^[A-Z]/i, '')
  const len = numeric.length
  return {
    isParent: len === 1,
    isMiddle: len === 2,
    isChild: len >= 3,
  }
}

export const interventionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(['parent', 'middle', 'child', 'all']).default('all'),
        parentCode: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = {}

      if (input.type === 'parent') where.isParent = true
      else if (input.type === 'middle') where.isMiddle = true
      else if (input.type === 'child') where.isChild = true

      if (input.parentCode) {
        where.codeTravail = { startsWith: input.parentCode }
      }

      if (input.search) {
        where.OR = [
          { codeTravail: { contains: input.search, mode: 'insensitive' } },
          { libelle: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      return ctx.prisma.intervention.findMany({
        where,
        orderBy: { codeTravail: 'asc' },
      })
    }),

  tree: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.prisma.intervention.findMany({
      orderBy: { codeTravail: 'asc' },
    })

    const parents = all.filter((i) => i.isParent)
    const middles = all.filter((i) => i.isMiddle)
    const children = all.filter((i) => i.isChild)

    const middleSet = new Set(middles.map((m) => m.codeTravail))
    const parentSet = new Set(parents.map((p) => p.codeTravail))

    const tree = parents.map((parent) => {
      const parentMiddles = middles.filter((m) =>
        m.codeTravail.startsWith(parent.codeTravail)
      )

      const directChildren = children.filter((c) => {
        const possibleMiddle = c.codeTravail.substring(0, 3)
        return (
          c.codeTravail.startsWith(parent.codeTravail) &&
          !middleSet.has(possibleMiddle)
        )
      })

      const middleWithChildren = parentMiddles.map((middle) => ({
        ...middle,
        children: children.filter((c) =>
          c.codeTravail.startsWith(middle.codeTravail)
        ),
      }))

      return {
        ...parent,
        children: middleWithChildren,
        directChildren,
      }
    })

    const orphans = children.filter((c) => {
      const possibleParent = c.codeTravail.substring(0, 2)
      const possibleMiddle = c.codeTravail.substring(0, 3)
      return !parentSet.has(possibleParent) && !middleSet.has(possibleMiddle)
    })

    return { tree, orphans }
  }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.intervention.findUnique({
        where: { codeTravail: input.code },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        codeTravail: z.string(),
        libelle: z.string(),
        prixPublic: z.number().default(0),
        prixPriseCharge: z.number().default(0),
        prixTiko: z.number().default(0),
        prixPersonnel: z.number().default(0),
        prixRetraite: z.number().default(0),
        prixEnfcd: z.number().default(0),
        produits: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { produits, ...data } = input
      const { isParent, isMiddle, isChild } = classifyCode(input.codeTravail)

      const intervention = await ctx.prisma.intervention.create({
        data: {
          ...data,
          produit1: produits?.[0],
          produit2: produits?.[1],
          produit3: produits?.[2],
          produit4: produits?.[3],
          produit5: produits?.[4],
          produit6: produits?.[5],
          produit7: produits?.[6],
          produit8: produits?.[7],
          produit9: produits?.[8],
          produit10: produits?.[9],
          isParent,
          isMiddle,
          isChild,
        },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'intervention',
          entityType: 'Intervention',
          entityId: intervention.id.toString(),
          details: { codeTravail: intervention.codeTravail, libelle: intervention.libelle },
        },
      })

      return intervention
    }),

  update: protectedProcedure
    .input(
      z.object({
        codeTravail: z.string(),
        libelle: z.string().optional(),
        prixPublic: z.number().optional(),
        prixPriseCharge: z.number().optional(),
        prixTiko: z.number().optional(),
        prixPersonnel: z.number().optional(),
        prixRetraite: z.number().optional(),
        prixEnfcd: z.number().optional(),
        produits: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { codeTravail, produits, ...data } = input

      const existing = await ctx.prisma.intervention.findUnique({
        where: { codeTravail },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Intervention non trouvée' })
      }

      const produitData: any = {}
      if (produits) {
        for (let i = 0; i < 10; i++) {
          produitData[`produit${i + 1}`] = produits[i] || null
        }
      }

      const intervention = await ctx.prisma.intervention.update({
        where: { codeTravail },
        data: { ...data, ...produitData },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'UPDATE',
          module: 'intervention',
          entityType: 'Intervention',
          entityId: intervention.id.toString(),
          details: data,
        },
      })

      return intervention
    }),

  delete: protectedProcedure
    .input(z.object({ codeTravail: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.intervention.findUnique({
        where: { codeTravail: input.codeTravail },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Intervention non trouvée' })
      }

      if (ctx.user!.role === 'OPERATOR') {
        await ctx.prisma.deletionRequest.create({
          data: {
            userId: ctx.user!.id,
            module: 'intervention',
            entityType: 'Intervention',
            entityId: existing.id.toString(),
            reason: 'Demande de suppression par opérateur',
          },
        })
        return { success: true, message: 'Demande de suppression envoyée' }
      }

      await ctx.prisma.intervention.delete({ where: { codeTravail: input.codeTravail } })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'DELETE',
          module: 'intervention',
          entityType: 'Intervention',
          entityId: existing.id.toString(),
          details: { codeTravail: existing.codeTravail, libelle: existing.libelle },
        },
      })

      return { success: true, message: 'Intervention supprimée' }
    }),
})
