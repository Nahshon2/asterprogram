import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { authRouter } from './routes/auth'
import { doctorsRouter } from './routes/doctors'
import { templatesRouter } from './routes/templates'
import { generationsRouter } from './routes/generations'
import { scraperRouter } from './routes/scraper'
import { adminRouter } from './routes/admin'
import { uploadRouter } from './routes/upload'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './lib/logger'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/doctors', doctorsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/generations', generationsRouter)
app.use('/api/scraper', scraperRouter)
app.use('/api/admin', adminRouter)
app.use('/api/upload', uploadRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`)
})

export default app
