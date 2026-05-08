import * as cheerio from 'cheerio'
import { logger } from '../lib/logger'

export interface ScrapedDoctorData {
  name?: string
  title?: string
  specialization?: string
  hospital?: string
  bio?: string
  phone?: string
  email?: string
  experience?: number
  education?: string[]
  certifications?: string[]
  languages?: string[]
  imageUrl?: string
  linkedinUrl?: string
}

export class DoctorScraper {
  private timeout: number

  constructor() {
    this.timeout = parseInt(process.env.SCRAPER_TIMEOUT_MS || '15000')
  }

  async extract(url: string): Promise<ScrapedDoctorData> {
    const html = await this.fetchHtml(url)
    const $ = cheerio.load(html)

    const data: ScrapedDoctorData = {}

    // Extract name
    data.name = this.extractName($, url)
    data.title = this.extractTitle($)
    data.specialization = this.extractSpecialization($)
    data.hospital = this.extractHospital($, url)
    data.bio = this.extractBio($)
    data.phone = this.extractPhone($, html)
    data.email = this.extractEmail($, html)
    data.experience = this.extractExperience($, html)
    data.education = this.extractEducation($)
    data.certifications = this.extractCertifications($)
    data.imageUrl = this.extractImage($, url)

    logger.info(`Scraped doctor data from ${url}`, { name: data.name })
    return data
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (compatible; DoctorIdentityBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } finally {
      clearTimeout(timeout)
    }
  }

  private extractName($: cheerio.CheerioAPI, _url: string): string | undefined {
    const selectors = [
      // Schema.org
      '[itemprop="name"]',
      '[itemtype*="Physician"] [itemprop="name"]',
      '[itemtype*="Doctor"] [itemprop="name"]',
      // Common patterns
      'h1.doctor-name',
      'h1.physician-name',
      'h1.provider-name',
      '.doctor-name h1',
      '.physician-name h1',
      '.doctor-profile h1',
      '.provider-profile h1',
      // LinkedIn
      '.top-card-layout__title',
      // Generic
      'h1',
    ]

    for (const sel of selectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length > 2 && text.length < 100) {
        return this.cleanName(text)
      }
    }
    return undefined
  }

  private extractTitle($: cheerio.CheerioAPI): string | undefined {
    const text = $('[itemprop="honorificPrefix"], .doctor-title, .physician-title, .provider-credentials')
      .first()
      .text()
      .trim()
    return text || undefined
  }

  private extractSpecialization($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[itemprop="medicalSpecialty"]',
      '.doctor-specialty',
      '.physician-specialty',
      '.specialty',
      '.specialization',
      '.provider-specialty',
      '.board-certification',
    ]

    for (const sel of selectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length > 2) return text
    }

    // Try meta description
    const meta = $('meta[name="description"]').attr('content') || ''
    const specMatch = meta.match(/specializ(?:es?|ation) in ([^.]+)/i)
    if (specMatch) return specMatch[1].trim()

    return undefined
  }

  private extractHospital($: cheerio.CheerioAPI, url: string): string | undefined {
    const selectors = [
      '[itemprop="hospitalAffiliation"]',
      '[itemprop="worksFor"]',
      '.hospital-name',
      '.facility-name',
      '.practice-name',
      '.organization-name',
    ]

    for (const sel of selectors) {
      const text = $(sel).first().text().trim()
      if (text) return text
    }

    // Try to extract from page title or URL
    const title = $('title').text()
    const titleMatch = title.match(/(?:at|@)\s+([^|–-]+)/i)
    if (titleMatch) return titleMatch[1].trim()

    return undefined
  }

  private extractBio($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[itemprop="description"]',
      '.doctor-bio',
      '.physician-bio',
      '.provider-bio',
      '.about-doctor',
      '.doctor-about',
      '.biography',
      '#biography',
      '.doctor-description',
    ]

    for (const sel of selectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length > 50) return text.slice(0, 1000)
    }
    return undefined
  }

  private extractPhone($: cheerio.CheerioAPI, html: string): string | undefined {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
    const match = html.match(phoneRegex)
    return match ? match[0] : undefined
  }

  private extractEmail($: cheerio.CheerioAPI, html: string): string | undefined {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const match = html.match(emailRegex)
    if (match && !match[0].includes('example.com')) return match[0]
    return undefined
  }

  private extractExperience($: cheerio.CheerioAPI, html: string): number | undefined {
    const patterns = [
      /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
      /experience[:\s]+(\d+)\+?\s*years?/i,
      /practicing\s+(?:for\s+)?(\d+)\+?\s*years?/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const years = parseInt(match[1])
        if (years > 0 && years < 80) return years
      }
    }
    return undefined
  }

  private extractEducation($: cheerio.CheerioAPI): string[] {
    const edu: string[] = []
    const selectors = ['.education li', '.medical-education li', '[itemprop="alumniOf"]']

    for (const sel of selectors) {
      $(sel).each((_i, el) => {
        const text = $(el).text().trim()
        if (text && text.length > 5) edu.push(text)
      })
      if (edu.length > 0) break
    }
    return edu.slice(0, 5)
  }

  private extractCertifications($: cheerio.CheerioAPI): string[] {
    const certs: string[] = []
    const selectors = ['.certifications li', '.board-certifications li', '[itemprop="hasCredential"]']

    for (const sel of selectors) {
      $(sel).each((_i, el) => {
        const text = $(el).text().trim()
        if (text && text.length > 5) certs.push(text)
      })
      if (certs.length > 0) break
    }
    return certs.slice(0, 5)
  }

  private extractImage($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const selectors = [
      '[itemprop="image"]',
      '.doctor-photo img',
      '.physician-photo img',
      '.provider-photo img',
      '.doctor-image img',
      '.headshot img',
      '.profile-photo img',
      '.staff-photo img',
      'img[alt*="doctor" i]',
      'img[alt*="physician" i]',
      'img[alt*="Dr." i]',
    ]

    for (const sel of selectors) {
      const src = $(sel).first().attr('src') || $(sel).first().attr('data-src')
      if (src && !src.includes('placeholder') && !src.includes('default')) {
        try {
          return new URL(src, baseUrl).href
        } catch {
          return src
        }
      }
    }
    return undefined
  }

  private cleanName(name: string): string {
    // Remove common prefixes/suffixes that are separate elements
    return name
      .replace(/^(Dr\.?|Prof\.?|MD|PhD)\s+/i, '')
      .replace(/\s*(MD|PhD|DO|MBBS|FRCS|FACS|MPH)\.?$/i, '')
      .trim()
  }
}
