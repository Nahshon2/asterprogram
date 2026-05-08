import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const doctorsRouter = Router()
doctorsRouter.use(authenticate)

const doctorSchema = z.object({
  name: z.string().min(2),
  title: z.string().optional(),
  specialization: z.string().min(2),
  subSpecialization: z.string().optional(),
  experience: z.number().int().min(0).max(80).optional(),
  bio: z.string().optional(),
  hospital: z.string().optional(),
  department: z.string().optional(),
  education: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  inputMethod: z.enum(['MANUAL', 'UPLOAD', 'URL_SCRAPE']).optional().default('MANUAL'),
})

// List doctors for current user
doctorsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '12', search = '', specialization = '' } = req.query

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
  const where = {
    userId: req.user!.id,
    ...(search && { name: { contains: search as string, mode: 'insensitive' as const } }),
    ...(specialization && { specialization: { contains: specialization as string, mode: 'insensitive' as const } }),
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { generations: true } },
      },
    }),
    prisma.doctor.count({ where }),
  ])

  res.json({
    doctors,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  })
})

// Get single doctor
doctorsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      images: true,
      identityProfile: true,
      generations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { template: true },
      },
    },
  })

  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }
  res.json(doctor)
})

// Create doctor
doctorsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = doctorSchema.parse(req.body)
    const doctor = await prisma.doctor.create({
      data: { ...data, userId: req.user!.id },
      include: { images: true },
    })
    res.status(201).json(doctor)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

// Update doctor
doctorsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.doctor.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!existing) {
      res.status(404).json({ error: 'Doctor not found' })
      return
    }

    const data = doctorSchema.partial().parse(req.body)
    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data,
      include: { images: true },
    })
    res.json(doctor)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

// Delete doctor
doctorsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.doctor.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!existing) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }

  await prisma.doctor.delete({ where: { id: req.params.id } })
  res.json({ message: 'Doctor deleted successfully' })
})

// Set primary image
doctorsRouter.patch('/:id/images/:imageId/primary', async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }

  await prisma.$transaction([
    prisma.doctorImage.updateMany({
      where: { doctorId: req.params.id },
      data: { isPrimary: false },
    }),
    prisma.doctorImage.update({
      where: { id: req.params.imageId },
      data: { isPrimary: true },
    }),
  ])

  res.json({ message: 'Primary image updated' })
})

// Delete image
doctorsRouter.delete('/:id/images/:imageId', async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }

  await prisma.doctorImage.delete({ where: { id: req.params.imageId } })
  res.json({ message: 'Image deleted' })
})
