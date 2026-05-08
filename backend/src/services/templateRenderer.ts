import sharp from 'sharp'
import { logger } from '../lib/logger'

interface TextZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  align: 'left' | 'center' | 'right'
  font: string
  size: number
  color: string
  field: string
  weight: 'normal' | 'bold' | 'semibold'
}

interface ImagePosition {
  x: number
  y: number
  width: number
  height: number
  borderRadius?: number
}

interface TemplateConfig {
  canvasWidth: number
  canvasHeight: number
  imagePosition: ImagePosition
  textZones: TextZone[]
  backgroundStyle: string
  backgroundColor?: string
  backgroundGradient?: { from: string; to: string; direction: string }
  lightingStyle: string
  accentColor: string
  secondaryColor: string
  primaryFont: string
  outputFormats: string[]
  outputDpi: number
}

interface RenderContext {
  doctor: Record<string, any>
  templateConfig: TemplateConfig
  primaryImage?: string
  allImages?: string[]
  identityProfile?: any
}

export class TemplateRenderer {
  async render(ctx: RenderContext): Promise<Record<string, Buffer>> {
    const { templateConfig: config, doctor } = ctx
    const outputs: Record<string, Buffer> = {}

    const compositeBuffer = await this.renderComposite(ctx)

    for (const format of config.outputFormats || ['png']) {
      switch (format) {
        case 'png':
          outputs.png = await sharp(compositeBuffer).png({ compressionLevel: 6 }).toBuffer()
          break
        case 'jpg':
        case 'jpeg':
          outputs.jpg = await sharp(compositeBuffer).jpeg({ quality: 92 }).toBuffer()
          break
        case 'webp':
          outputs.webp = await sharp(compositeBuffer).webp({ quality: 90 }).toBuffer()
          break
        case 'pdf':
          // Generate PDF-ready high-res PNG (PDF generation requires puppeteer/pdfkit in full impl)
          outputs.pdf = await sharp(compositeBuffer)
            .resize(
              Math.round(config.canvasWidth * (config.outputDpi / 96)),
              Math.round(config.canvasHeight * (config.outputDpi / 96))
            )
            .png()
            .toBuffer()
          break
      }
    }

    return outputs
  }

  private async renderComposite(ctx: RenderContext): Promise<Buffer> {
    const { templateConfig: config, doctor, primaryImage } = ctx
    const { canvasWidth: W, canvasHeight: H } = config

    // Build SVG overlay with text zones
    const svgText = this.buildSvgTextLayer(config, doctor)

    // Create background
    const background = await this.createBackground(config)

    // Build composite layers
    const composites: sharp.OverlayOptions[] = []

    // Add doctor image if available
    if (primaryImage) {
      try {
        const photoBuffer = await this.fetchAndProcessPhoto(
          primaryImage,
          config.imagePosition,
          ctx.identityProfile
        )
        composites.push({
          input: photoBuffer,
          left: config.imagePosition.x,
          top: config.imagePosition.y,
        })
      } catch (err) {
        logger.warn('Failed to process doctor photo:', err)
      }
    } else {
      // Placeholder silhouette
      const placeholder = await this.createPhotoPlaceholder(config.imagePosition, config.accentColor)
      composites.push({
        input: placeholder,
        left: config.imagePosition.x,
        top: config.imagePosition.y,
      })
    }

    // Add text layer
    composites.push({
      input: Buffer.from(svgText),
      top: 0,
      left: 0,
    })

    return sharp(background).composite(composites).toBuffer()
  }

  private async createBackground(config: TemplateConfig): Promise<Buffer> {
    const { canvasWidth: W, canvasHeight: H } = config

    if (config.backgroundGradient) {
      const { from, to, direction } = config.backgroundGradient
      const gradSvg = this.buildGradientSvg(W, H, from, to, direction)
      return sharp(Buffer.from(gradSvg)).png().toBuffer()
    }

    const bgColor = config.backgroundColor || '#F8FAFC'
    const { r, g, b } = this.hexToRgb(bgColor)

    return sharp({
      create: { width: W, height: H, channels: 3, background: { r, g, b } },
    }).png().toBuffer()
  }

  private buildGradientSvg(W: number, H: number, from: string, to: string, direction: string): string {
    const gradId = 'bg-grad'
    const isHorizontal = direction === 'horizontal'
    const isDiagonal = direction === 'diagonal'

    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="${isHorizontal || isDiagonal ? '100%' : '0%'}" y2="${!isHorizontal ? '100%' : '0%'}">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${gradId})"/>
</svg>`
  }

  private buildSvgTextLayer(config: TemplateConfig, doctor: Record<string, any>): string {
    const { canvasWidth: W, canvasHeight: H, textZones } = config

    const textElements = textZones.map((zone) => {
      const value = this.getFieldValue(doctor, zone.field)
      if (!value) return ''

      const fontWeight = zone.weight === 'bold' ? 'bold' : zone.weight === 'semibold' ? '600' : 'normal'
      const anchor = zone.align === 'center' ? 'middle' : zone.align === 'right' ? 'end' : 'start'
      const textX = zone.align === 'center' ? zone.x + zone.width / 2 : zone.x
      const textY = zone.y + zone.size

      const lines = this.wrapText(value, zone.width, zone.size)
      const lineHeight = zone.size * 1.4

      return lines.map((line, i) =>
        `<text x="${textX}" y="${textY + i * lineHeight}"
          font-family="${zone.font}, Inter, sans-serif"
          font-size="${zone.size}"
          font-weight="${fontWeight}"
          fill="${zone.color}"
          text-anchor="${anchor}"
          dominant-baseline="auto">${this.escapeXml(line)}</text>`
      ).join('\n')
    })

    // Add accent line decoration
    const accentLine = `<line x1="0" y1="${H - 6}" x2="${W}" y2="${H - 6}"
      stroke="${config.accentColor}" stroke-width="6"/>`

    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${textElements.join('\n')}
  ${accentLine}
</svg>`
  }

  private async fetchAndProcessPhoto(
    imageUrl: string,
    pos: ImagePosition,
    _identityProfile?: any
  ): Promise<Buffer> {
    let imgBuffer: Buffer

    if (imageUrl.startsWith('http')) {
      const res = await fetch(imageUrl)
      const ab = await res.arrayBuffer()
      imgBuffer = Buffer.from(ab)
    } else {
      const fs = await import('fs/promises')
      imgBuffer = await fs.readFile(imageUrl)
    }

    // Resize and crop to fit position
    let processed = sharp(imgBuffer)
      .resize(pos.width, pos.height, { fit: 'cover', position: 'top' })

    if (pos.borderRadius && pos.borderRadius > 0) {
      const mask = this.buildRoundedRectMask(pos.width, pos.height, pos.borderRadius)
      processed = processed.composite([
        { input: Buffer.from(mask), blend: 'dest-in' },
      ])
    }

    return processed.png().toBuffer()
  }

  private async createPhotoPlaceholder(pos: ImagePosition, accentColor: string): Promise<Buffer> {
    const { r, g, b } = this.hexToRgb(accentColor)
    const lighterBg = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`

    const svg = `<svg width="${pos.width}" height="${pos.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${pos.width}" height="${pos.height}" fill="${lighterBg}" rx="${pos.borderRadius || 0}"/>
  <circle cx="${pos.width / 2}" cy="${pos.height * 0.35}" r="${pos.width * 0.18}" fill="white" opacity="0.7"/>
  <ellipse cx="${pos.width / 2}" cy="${pos.height * 0.9}" rx="${pos.width * 0.3}" ry="${pos.height * 0.28}" fill="white" opacity="0.7"/>
</svg>`

    return sharp(Buffer.from(svg)).png().toBuffer()
  }

  private buildRoundedRectMask(w: number, h: number, r: number): string {
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
</svg>`
  }

  private getFieldValue(doctor: Record<string, any>, field: string): string {
    const value = doctor[field]
    if (value === null || value === undefined) return ''
    return String(value)
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const approxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6))
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      if ((current + ' ' + word).trim().length > approxCharsPerLine) {
        if (current) lines.push(current.trim())
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) lines.push(current.trim())

    return lines.slice(0, 6) // max 6 lines
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '')
    return {
      r: parseInt(clean.slice(0, 2), 16) || 0,
      g: parseInt(clean.slice(2, 4), 16) || 0,
      b: parseInt(clean.slice(4, 6), 16) || 0,
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
