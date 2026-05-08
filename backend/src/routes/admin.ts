import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

export const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'))

// Dashboard stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [users, doctors, generations, pendingGenerations] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.generation.count(),
    prisma.generation.count({ where: { status: 'PROCESSING' } }),
  ])

  const recentGenerations = await prisma.generation.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      doctor: { select: { name: true } },
      template: { select: { name: true } },
    },
  })

  const generationsByStatus = await prisma.generation.groupBy({
    by: ['status'],
    _count: true,
  })

  res.json({
    stats: { users, doctors, generations, pendingGenerations },
    recentGenerations,
    generationsByStatus,
  })
})

// User management
adminRouter.get('/users', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search = '' } = req.query
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

  const where = search
    ? {
        OR: [
          { email: { contains: search as string, mode: 'insensitive' as const } },
          { name: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        isActive: true,
        createdAt: true,
        _count: { select: { doctors: true, generations: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users, pagination: { total, page: parseInt(page as string) } })
})

adminRouter.patch('/users/:id', async (req: Request, res: Response) => {
  const schema = z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional(),
  })
  const data = schema.parse(req.body)

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, role: true, isActive: true },
  })
  res.json(user)
})

// Generation management
adminRouter.get('/generations', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status } = req.query
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

  const [generations, total] = await Promise.all([
    prisma.generation.findMany({
      where: { ...(status && { status: status as any }) },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        doctor: { select: { name: true } },
        template: { select: { name: true, layout: true } },
      },
    }),
    prisma.generation.count({ where: { ...(status && { status: status as any }) } }),
  ])

  res.json({ generations, pagination: { total, page: parseInt(page as string) } })
})

// Hospital themes
adminRouter.get('/themes', async (_req: Request, res: Response) => {
  const themes = await prisma.hospitalTheme.findMany({ orderBy: { name: 'asc' } })
  res.json(themes)
})

adminRouter.post('/themes', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    hospitalName: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    fontFamily: z.string().optional().default('Inter'),
    logoUrl: z.string().url().optional(),
  })

  const data = schema.parse(req.body)
  const theme = await prisma.hospitalTheme.create({ data })
  res.status(201).json(theme)
})

adminRouter.patch('/themes/:id', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontFamily: z.string().optional(),
    logoUrl: z.string().url().optional(),
    isDefault: z.boolean().optional(),
  })

  const data = schema.parse(req.body)
  const theme = await prisma.hospitalTheme.update({ where: { id: req.params.id }, data })
  res.json(theme)
})

// System settings
adminRouter.get('/settings', async (_req: Request, res: Response) => {
  const settings = await prisma.systemSetting.findMany()
  res.json(settings)
})

adminRouter.patch('/settings/:key', async (req: Request, res: Response) => {
  const { value } = z.object({ value: z.string() }).parse(req.body)
  const setting = await prisma.systemSetting.upsert({
    where: { key: req.params.key },
    update: { value },
    create: { key: req.params.key, value },
  })
  res.json(setting)
})
