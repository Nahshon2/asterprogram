import { Router, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { uploadFile } from '../lib/storage'

export const uploadRouter = Router()
uploadRouter.use(authenticate)

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and TIFF images are allowed'))
    }
  },
})

uploadRouter.post('/doctor/:doctorId/images', upload.array('images', 10), async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: req.params.doctorId, userId: req.user!.id },
    include: { _count: { select: { images: true } } },
  })

  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }

  const files = req.files as Express.Multer.File[]
  if (!files?.length) {
    res.status(400).json({ error: 'No files uploaded' })
    return
  }

  const maxUploads = 10
  if (doctor._count.images + files.length > maxUploads) {
    res.status(400).json({ error: `Maximum ${maxUploads} images per doctor` })
    return
  }

  const existingImages = await prisma.doctorImage.count({ where: { doctorId: doctor.id } })
  const uploaded: any[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Process with sharp
    const processed = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()

    const metadata = await sharp(processed).metadata()

    // Create thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 75 })
      .toBuffer()

    // Upload both
    const [imageUrl, thumbnailUrl] = await Promise.all([
      uploadFile(processed, file.originalname, 'image/jpeg', `doctors/${doctor.id}`),
      uploadFile(thumbnail, `thumb_${file.originalname}`, 'image/jpeg', `doctors/${doctor.id}/thumbs`),
    ])

    const doctorImage = await prisma.doctorImage.create({
      data: {
        doctorId: doctor.id,
        url: imageUrl,
        thumbnailUrl,
        isPrimary: existingImages === 0 && i === 0,
        width: metadata.width,
        height: metadata.height,
        fileSize: processed.length,
        mimeType: 'image/jpeg',
      },
    })

    uploaded.push(doctorImage)
  }

  res.status(201).json({ uploaded, count: uploaded.length })
})
