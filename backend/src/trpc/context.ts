import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { verifyToken } from '../lib/auth'

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest
  res: FastifyReply
}) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  let user = null
  if (token) {
    try {
      const decoded = verifyToken(token)
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
          permissions: true,
          isActive: true,
        },
      })
    } catch (error) {
      // Token invalide, user reste null
    }
  }

  return {
    req,
    res,
    user,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
