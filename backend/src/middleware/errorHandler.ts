import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack })

  const status = err.status || 500
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message

  res.status(status).json({ error: message, code: err.code })
}
