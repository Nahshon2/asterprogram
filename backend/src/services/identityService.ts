import sharp from 'sharp'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

interface ImageRef {
  id: string
  url: string
  isPrimary: boolean
}

interface IdentityProfile {
  colorProfile: ColorProfile
  facialFeatures: FacialFeatures
  consistencyScore: number
  referenceImageId: string
}

interface ColorProfile {
  dominantColors: string[]
  skinToneRange: string
  hairColor: string
  averageBrightness: number
}

interface FacialFeatures {
  aspectRatio: number
  faceRegion: { x: number; y: number; w: number; h: number } | null
  hasFace: boolean
}

export class IdentityService {
  async buildProfile(doctorId: string, images: ImageRef[]): Promise<IdentityProfile> {
    logger.info(`Building identity profile for doctor ${doctorId}`)

    // Use primary image as reference
    const reference = images.find((i) => i.isPrimary) || images[0]
    if (!reference) {
      throw new Error('No images available for identity profiling')
    }

    try {
      const imageBuffer = await this.fetchImageBuffer(reference.url)
      const colorProfile = await this.analyzeColor(imageBuffer)
      const facialFeatures = await this.analyzeFacialRegion(imageBuffer)

      const profile: IdentityProfile = {
        colorProfile,
        facialFeatures,
        consistencyScore: 0.95,
        referenceImageId: reference.id,
      }

      // Persist identity profile
      await prisma.identityProfile.upsert({
        where: { doctorId },
        create: {
          doctorId,
          colorProfile: colorProfile as any,
          facialFeatures: facialFeatures as any,
          consistencyScore: profile.consistencyScore,
          referenceImageId: reference.id,
        },
        update: {
          colorProfile: colorProfile as any,
          facialFeatures: facialFeatures as any,
          consistencyScore: profile.consistencyScore,
          referenceImageId: reference.id,
        },
      })

      return profile
    } catch (err) {
      logger.error('Identity profiling failed:', err)
      throw err
    }
  }

  private async fetchImageBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('http')) {
      const res = await fetch(url)
      const arrayBuffer = await res.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
    // Local file
    const fs = await import('fs/promises')
    return fs.readFile(url)
  }

  private async analyzeColor(buffer: Buffer): Promise<ColorProfile> {
    const { dominant, channels } = await sharp(buffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(async ({ data, info }) => {
        // Sample pixels for dominant colors
        const pixels: [number, number, number][] = []
        for (let i = 0; i < data.length - 3; i += info.channels * 10) {
          pixels.push([data[i], data[i + 1], data[i + 2]])
        }

        // Simple average color
        const avg = pixels.reduce(
          (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
          [0, 0, 0]
        ).map((v) => Math.round(v / pixels.length))

        const avgBrightness =
          pixels.reduce((acc, [r, g, b]) => acc + (r + g + b) / 3, 0) / pixels.length

        return {
          dominant: this.rgbToHex(avg[0], avg[1], avg[2]),
          channels: { brightness: avgBrightness },
        }
      })

    const meta = await sharp(buffer).metadata()

    return {
      dominantColors: [dominant],
      skinToneRange: this.classifySkinTone(channels.brightness),
      hairColor: 'natural',
      averageBrightness: channels.brightness,
    }
  }

  private async analyzeFacialRegion(buffer: Buffer): Promise<FacialFeatures> {
    const meta = await sharp(buffer).metadata()
    const { width = 1, height = 1 } = meta

    // Without a face detection model, estimate the face region as the upper-center portion
    // In production, integrate with face-api.js, AWS Rekognition, or Google Vision API
    const estimatedFaceRegion = {
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.05),
      w: Math.round(width * 0.6),
      h: Math.round(height * 0.5),
    }

    return {
      aspectRatio: width / height,
      faceRegion: estimatedFaceRegion,
      hasFace: true, // Assume face present in doctor photos
    }
  }

  private classifySkinTone(brightness: number): string {
    if (brightness < 80) return 'deep'
    if (brightness < 130) return 'medium-deep'
    if (brightness < 170) return 'medium'
    if (brightness < 210) return 'medium-light'
    return 'light'
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  async validateConsistency(doctorId: string, newImageBuffer: Buffer): Promise<number> {
    const profile = await prisma.identityProfile.findUnique({ where: { doctorId } })
    if (!profile) return 1.0

    const newColor = await this.analyzeColor(newImageBuffer)
    const storedColor = profile.colorProfile as unknown as ColorProfile

    // Simple brightness-based consistency check
    // In production: use face embedding distance (FaceNet, ArcFace, etc.)
    const brightnessDiff = Math.abs(
      newColor.averageBrightness - storedColor.averageBrightness
    )
    return Math.max(0, 1 - brightnessDiff / 255)
  }
}
