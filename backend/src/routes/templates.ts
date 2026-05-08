import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

export const templatesRouter = Router()

// Public template listing (no auth required)
templatesRouter.get('/', async (req: Request, res: Response) => {
  const { layout, category, premium } = req.query

  const templates = await prisma.template.findMany({
    where: {
      isActive: true,
      isPublic: true,
      ...(layout && { layout: layout as any }),
      ...(category && { category: category as string }),
      ...(premium !== undefined && { isPremium: premium === 'true' }),
    },
    orderBy: { sortOrder: 'asc' },
    include: { config: true },
  })

  res.json(templates)
})

templatesRouter.get('/:id', async (req: Request, res: Response) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, isActive: true },
    include: { config: true },
  })

  if (!template) {
    res.status(404).json({ error: 'Template not found' })
    return
  }
  res.json(template)
})

// Admin routes
const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'))

const templateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  layout: z.enum(['PROFILE_CARD', 'BANNER', 'BROCHURE', 'PRESENTATION_SLIDE', 'SOCIAL_MEDIA', 'PRINT_READY']),
  category: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(true),
  isPremium: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  config: z.object({
    canvasWidth: z.number().int().default(1200),
    canvasHeight: z.number().int().default(800),
    imagePosition: z.any(),
    textZones: z.array(z.any()).default([]),
    backgroundStyle: z.string().default('medical_premium'),
    backgroundColor: z.string().optional(),
    backgroundGradient: z.any().optional(),
    lightingStyle: z.string().default('soft_studio'),
    primaryFont: z.string().default('Inter'),
    secondaryFont: z.string().default('Inter'),
    accentColor: z.string().default('#1E40AF'),
    secondaryColor: z.string().default('#BFDBFE'),
    showLogo: z.boolean().default(false),
    outputFormats: z.array(z.string()).default(['png']),
    outputDpi: z.number().int().default(300),
  }).optional(),
})

adminRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { config, ...data } = templateSchema.parse(req.body)

    const template = await prisma.template.create({
      data: {
        ...data,
        ...(config && { config: { create: config } }),
      },
      include: { config: true },
    })
    res.status(201).json(template)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

adminRouter.patch('/:id', async (req: Request, res: Response) => {
  const { config, ...data } = templateSchema.partial().parse(req.body)

  const template = await prisma.template.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(config && {
        config: {
          upsert: {
            create: config,
            update: config,
          },
        },
      }),
    },
    include: { config: true },
  })
  res.json(template)
})

adminRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.template.delete({ where: { id: req.params.id } })
  res.json({ message: 'Template deleted' })
})

templatesRouter.use('/admin', adminRouter)
