import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  organization: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    const exists = await prisma.user.findUnique({ where: { email: data.email } })
    if (exists) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        organization: data.organization,
      },
      select: { id: true, email: true, name: true, role: true, organization: true },
    })

    res.status(201).json({ user, message: 'Registration successful' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors })
      return
    }
    throw err
  }
})

authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.slice(7)
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  res.json({ message: 'Logged out successfully' })
})

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organization: true,
      avatar: true,
      createdAt: true,
      _count: { select: { doctors: true, generations: true } },
    },
  })
  res.json(user)
})

authRouter.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    organization: z.string().optional(),
  })
  const data = schema.parse(req.body)

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, email: true, name: true, role: true, organization: true },
  })
  res.json(user)
})
