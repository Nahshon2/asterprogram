import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { DoctorScraper } from '../services/scraper'

export const scraperRouter = Router()
scraperRouter.use(authenticate)

const scrapeSchema = z.object({
  url: z.string().url(),
})

scraperRouter.post('/extract', async (req: AuthRequest, res: Response) => {
  try {
    const { url } = scrapeSchema.parse(req.body)

    const job = await prisma.scrapeJob.create({
      data: { url, userId: req.user!.id, status: 'RUNNING' },
    })

    const scraper = new DoctorScraper()

    try {
      const result = await scraper.extract(url)

      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: { status: 'DONE', result: result as any },
      })

      res.json({ jobId: job.id, data: result })
    } catch (err: any) {
      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: err.message },
      })
      res.status(422).json({ error: 'Failed to extract data from URL', details: err.message })
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid URL', details: err.errors })
      return
    }
    throw err
  }
})

scraperRouter.post('/create-doctor', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({ url: z.string().url() })
    const { url } = schema.parse(req.body)

    const scraper = new DoctorScraper()
    const scraped = await scraper.extract(url)

    const doctor = await prisma.doctor.create({
      data: {
        userId: req.user!.id,
        name: scraped.name || 'Unknown Doctor',
        specialization: scraped.specialization || 'General Medicine',
        title: scraped.title,
        hospital: scraped.hospital,
        bio: scraped.bio,
        phone: scraped.phone,
        email: scraped.email,
        experience: scraped.experience,
        education: scraped.education || [],
        certifications: scraped.certifications || [],
        languages: scraped.languages || [],
        sourceUrl: url,
        inputMethod: 'URL_SCRAPE',
      },
    })

    // Store scraped image if available
    if (scraped.imageUrl) {
      await prisma.doctorImage.create({
        data: {
          doctorId: doctor.id,
          url: scraped.imageUrl,
          isPrimary: true,
        },
      })
    }

    res.status(201).json({ doctor, scraped })
  } catch (err: any) {
    res.status(422).json({ error: 'Scraping failed', details: err.message })
  }
})
