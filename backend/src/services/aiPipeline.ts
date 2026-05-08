import { prisma } from '../lib/prisma'
import { TemplateRenderer } from './templateRenderer'
import { IdentityService } from './identityService'
import { uploadFile } from '../lib/storage'
import { logger } from '../lib/logger'

interface DoctorData {
  id: string
  name: string
  title: string | null
  specialization: string
  subSpecialization: string | null
  experience: number | null
  bio: string | null
  hospital: string | null
  department: string | null
  phone: string | null
  email: string | null
  education: string[]
  certifications: string[]
  images: { id: string; url: string; isPrimary: boolean }[]
  identityProfile: any
}

interface TemplateData {
  id: string
  name: string
  layout: string
  config: any
}

export class AIGenerationPipeline {
  private renderer: TemplateRenderer
  private identityService: IdentityService

  constructor() {
    this.renderer = new TemplateRenderer()
    this.identityService = new IdentityService()
  }

  async process(
    generationId: string,
    doctor: DoctorData,
    template: TemplateData,
    options: {
      selectedImages?: string[]
      customizations?: Record<string, any>
      hospitalThemeId?: string
    }
  ): Promise<void> {
    const startTime = Date.now()
    logger.info(`Starting generation pipeline for ${generationId}`)

    try {
      // Step 1: Select and validate images
      const images = this.selectImages(doctor.images, options.selectedImages)

      // Step 2: Build identity profile
      let identityData = doctor.identityProfile
      if (!identityData && images.length > 0) {
        identityData = await this.identityService.buildProfile(doctor.id, images)
      }

      // Step 3: Get hospital theme if specified
      let theme = null
      if (options.hospitalThemeId) {
        theme = await prisma.hospitalTheme.findUnique({
          where: { id: options.hospitalThemeId },
        })
      }

      // Step 4: Merge customizations with template config
      const effectiveConfig = this.mergeConfig(template.config, options.customizations, theme)

      // Step 5: Render template with doctor data
      const renderedBuffers = await this.renderer.render({
        doctor: this.buildDoctorContext(doctor),
        templateConfig: effectiveConfig,
        primaryImage: images[0]?.url,
        allImages: images.map((i) => i.url),
        identityProfile: identityData,
      })

      // Step 6: Upload outputs
      const outputUrls: Record<string, string> = {}

      for (const [format, buffer] of Object.entries(renderedBuffers)) {
        const mimeType = format === 'pdf' ? 'application/pdf' : `image/${format}`
        const fileName = `${generationId}_output.${format}`
        const url = await uploadFile(buffer, fileName, mimeType, `generations/${generationId}`)
        outputUrls[format] = url
      }

      const processingTime = Date.now() - startTime

      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          outputUrls,
          processingTime,
          aiProvider: 'template-renderer',
        },
      })

      logger.info(`Generation ${generationId} completed in ${processingTime}ms`)
    } catch (err: any) {
      logger.error(`Generation ${generationId} failed:`, err)

      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          processingTime: Date.now() - startTime,
        },
      })

      throw err
    }
  }

  private selectImages(
    allImages: { id: string; url: string; isPrimary: boolean }[],
    selectedIds?: string[]
  ) {
    if (selectedIds?.length) {
      const selected = allImages.filter((img) => selectedIds.includes(img.id))
      if (selected.length > 0) return selected
    }

    // Prefer primary image first
    return allImages.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
  }

  private buildDoctorContext(doctor: DoctorData) {
    return {
      name: doctor.name,
      fullName: `${doctor.title ? doctor.title + ' ' : ''}${doctor.name}`,
      title: doctor.title || 'Dr.',
      specialization: doctor.specialization,
      subSpecialization: doctor.subSpecialization,
      experience: doctor.experience
        ? `${doctor.experience}+ Years Experience`
        : null,
      bio: doctor.bio,
      hospital: doctor.hospital,
      department: doctor.department,
      phone: doctor.phone,
      email: doctor.email,
      education: doctor.education,
      certifications: doctor.certifications,
    }
  }

  private mergeConfig(baseConfig: any, customizations?: Record<string, any>, theme?: any | null) {
    if (!baseConfig) return {}

    const merged = { ...baseConfig }

    if (theme) {
      merged.accentColor = theme.primaryColor || merged.accentColor
      merged.secondaryColor = theme.secondaryColor || merged.secondaryColor
      merged.primaryFont = theme.fontFamily || merged.primaryFont
    }

    if (customizations) {
      Object.assign(merged, customizations)
    }

    return merged
  }
}
