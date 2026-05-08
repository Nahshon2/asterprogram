import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { AIGenerationPipeline } from '../services/aiPipeline'

export const generationsRouter = Router()
generationsRouter.use(authenticate)

const createGenerationSchema = z.object({
  doctorId: z.string(),
  templateId: z.string(),
  selectedImages: z.array(z.string()).optional().default([]),
  customizations: z.record(z.any()).optional(),
  hospitalThemeId: z.string().optional(),
})

generationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status, doctorId } = req.query

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
  const where = {
    userId: req.user!.id,
    ...(status && { status: status as any }),
    ...(doctorId && { doctorId: doctorId as string }),
  }

  const [generations, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        template: { select: { id: true, name: true, layout: true, thumbnailUrl: true } },
      },
    }),
    prisma.generation.count({ where }),
  ])

  res.json({
    generations,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  })
})

generationsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const generation = await prisma.generation.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      doctor: { include: { images: true } },
      template: { include: { config: true } },
    },
  })

  if (!generation) {
    res.status(404).json({ error: 'Generation not found' })
    return
  }
  res.json(generation)
})

generationsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createGenerationSchema.parse(req.body)

    // Verify doctor ownership
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, userId: req.user!.id },
      include: { images: true, identityProfile: true },
    })
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' })
      return
    }

    const template = await prisma.template.findFirst({
      where: { id: data.templateId, isActive: true },
      include: { config: true },
    })
    if (!template) {
      res.status(404).json({ error: 'Template not found' })
      return
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: req.user!.id,
        doctorId: data.doctorId,
        templateId: data.templateId,
        selectedImages: data.selectedImages,
        customizations: data.customizations,
        hospitalThemeId: data.hospitalThemeId,
        status: 'PROCESSING',
      },
    })

    // Trigger async pipeline
    const pipeline = new AIGenerationPipeline()
    pipeline.process(generation.id, doctor, template, data).catch((err) => {
      console.error('Pipeline error:', err)
      prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED', errorMessage: err.message },
      })
    })

    res.status(202).json({ generationId: generation.id, status: 'PROCESSING' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

generationsRouter.get('/:id/status', async (req: AuthRequest, res: Response) => {
  const generation = await prisma.generation.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    select: { id: true, status: true, outputUrls: true, errorMessage: true, processingTime: true },
  })

  if (!generation) {
    res.status(404).json({ error: 'Generation not found' })
    return
  }
  res.json(generation)
})

generationsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.generation.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!existing) {
    res.status(404).json({ error: 'Generation not found' })
    return
  }

  await prisma.generation.delete({ where: { id: req.params.id } })
  res.json({ message: 'Generation deleted' })
})
