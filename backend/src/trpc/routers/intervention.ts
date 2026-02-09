import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const interventionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(['parent', 'middle', 'child', 'all']).default('all'),
        parentCode: z.string().optional(),
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

      return ctx.prisma.intervention.findMany({
        where,
        orderBy: { codeTravail: 'asc' },
      })
    }),

  tree: protectedProcedure.query(async ({ ctx }) => {
    const parents = await ctx.prisma.intervention.findMany({
      where: { isParent: true },
      orderBy: { codeTravail: 'asc' },
    })

    const tree = await Promise.all(
      parents.map(async (parent) => {
        const middles = await ctx.prisma.intervention.findMany({
          where: {
            isMiddle: true,
            codeTravail: { startsWith: parent.codeTravail },
          },
          orderBy: { codeTravail: 'asc' },
        })

        const middleWithChildren = await Promise.all(
          middles.map(async (middle) => {
            const children = await ctx.prisma.intervention.findMany({
              where: {
                isChild: true,
                codeTravail: { startsWith: middle.codeTravail },
              },
              orderBy: { codeTravail: 'asc' },
            })

            return { ...middle, children }
          })
        )

        return { ...parent, children: middleWithChildren }
      })
    )

    return tree
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
        produits: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { produits, ...data } = input

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
          isParent: input.codeTravail.replace('I', '').length === 1,
          isMiddle: input.codeTravail.replace('I', '').length === 2,
          isChild: input.codeTravail.replace('I', '').length >= 3,
        },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'intervention',
          entityType: 'Intervention',
          entityId: intervention.id.toString(),
          details: { codeTravail: intervention.codeTravail },
        },
      })

      return intervention
    }),
})
