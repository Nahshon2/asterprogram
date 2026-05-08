import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    name: string | null
  }
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.token

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const payload = jwt.verify(token, secret) as { userId: string }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Session expired' })
      return
    }

    if (!session.user.isActive) {
      res.status(403).json({ error: 'Account disabled' })
      return
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}
