import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

export const patientRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        search: z.string().optional(),
        sexe: z.enum(['M', 'F']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, search, sexe } = input
      const skip = (page - 1) * limit

      const where: any = {}
      
      if (search) {
        where.OR = [
          { nom: { contains: search, mode: 'insensitive' } },
          { numeroPatient: { contains: search, mode: 'insensitive' } },
        ]
      }
      
      if (sexe) {
        where.sexe = sexe
      }

      const [patients, total] = await Promise.all([
        ctx.prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ derniereVisite: 'desc' }, { nom: 'asc' }],
          select: {
            id: true,
            numeroPatient: true,
            nom: true,
            dateNaissance: true,
            sexe: true,
            profession: true,
            telephone: true,
            derniereVisite: true,
          },
        }),
        ctx.prisma.patient.count({ where }),
      ])

      return {
        data: patients,
        total,
        page,
        pages: Math.ceil(total / limit),
      }
    }),

  getByNumero: protectedProcedure
    .input(z.object({ numero: z.string() }))
    .query(async ({ input, ctx }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { numeroPatient: input.numero },
        include: {
          factures: {
            orderBy: { dateVisite: 'desc' },
            take: 10,
          },
        },
      })

      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient non trouvé' })
      }

      return patient
    }),

  create: protectedProcedure
    .input(
      z.object({
        numeroPatient: z.string(),
        nom: z.string(),
        dateNaissance: z.string().optional(),
        sexe: z.enum(['M', 'F']).optional(),
        profession: z.string().optional(),
        adresse: z.string().optional(),
        telephone: z.string().optional(),
        telephone2: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const patient = await ctx.prisma.patient.create({
        data: {
          numeroPatient: input.numeroPatient,
          nom: input.nom,
          dateNaissance: input.dateNaissance ? new Date(input.dateNaissance) : null,
          sexe: input.sexe,
          profession: input.profession,
          adresse: input.adresse,
          telephone: input.telephone,
          telephone2: input.telephone2,
          observations: input.observations,
        },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'CREATE',
          module: 'patient',
          entityType: 'Patient',
          entityId: patient.id.toString(),
          details: { numeroPatient: patient.numeroPatient, nom: patient.nom },
        },
      })

      return patient
    }),

  update: protectedProcedure
    .input(
      z.object({
        numero: z.string(),
        nom: z.string().optional(),
        dateNaissance: z.string().optional(),
        sexe: z.enum(['M', 'F']).optional(),
        profession: z.string().optional(),
        adresse: z.string().optional(),
        telephone: z.string().optional(),
        telephone2: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { numero, ...data } = input

      const patient = await ctx.prisma.patient.update({
        where: { numeroPatient: numero },
        data: {
          ...data,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'UPDATE',
          module: 'patient',
          entityType: 'Patient',
          entityId: patient.id.toString(),
          details: data,
        },
      })

      return patient
    }),

  delete: protectedProcedure
    .input(z.object({ numero: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user!.role === 'OPERATOR') {
        const patient = await ctx.prisma.patient.findUnique({
          where: { numeroPatient: input.numero },
        })

        if (!patient) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        await ctx.prisma.deletionRequest.create({
          data: {
            userId: ctx.user!.id,
            module: 'patient',
            entityType: 'Patient',
            entityId: patient.id.toString(),
            reason: 'Demande de suppression par opérateur',
          },
        })

        return { success: true, message: 'Demande de suppression envoyée aux administrateurs' }
      }

      const patient = await ctx.prisma.patient.delete({
        where: { numeroPatient: input.numero },
      })

      await ctx.prisma.userLog.create({
        data: {
          userId: ctx.user!.id,
          action: 'DELETE',
          module: 'patient',
          entityType: 'Patient',
          entityId: patient.id.toString(),
          details: { numeroPatient: patient.numeroPatient, nom: patient.nom },
        },
      })

      return { success: true, message: 'Patient supprimé' }
    }),

  checkDoublons: protectedProcedure
    .input(z.object({ nom: z.string() }))
    .query(async ({ input, ctx }) => {
      const patients = await ctx.prisma.patient.findMany({
        where: {
          nom: {
            contains: input.nom,
            mode: 'insensitive',
          },
        },
        orderBy: { derniereVisite: 'desc' },
      })

      return patients
    }),
})
