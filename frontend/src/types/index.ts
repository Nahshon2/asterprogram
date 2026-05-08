export interface Doctor {
  id: string
  userId: string
  name: string
  title: string | null
  specialization: string
  subSpecialization: string | null
  experience: number | null
  bio: string | null
  hospital: string | null
  department: string | null
  education: string[]
  certifications: string[]
  languages: string[]
  phone: string | null
  email: string | null
  website: string | null
  linkedinUrl: string | null
  sourceUrl: string | null
  inputMethod: 'MANUAL' | 'UPLOAD' | 'URL_SCRAPE'
  images: DoctorImage[]
  identityProfile: IdentityProfile | null
  generations?: Generation[]
  _count?: { generations: number }
  createdAt: string
  updatedAt: string
}

export interface DoctorImage {
  id: string
  doctorId: string
  url: string
  thumbnailUrl: string | null
  isPrimary: boolean
  width: number | null
  height: number | null
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

export interface IdentityProfile {
  id: string
  doctorId: string
  colorProfile: any
  facialFeatures: any
  consistencyScore: number | null
  referenceImageId: string | null
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  layout: TemplateLayout
  category: string | null
  previewUrl: string | null
  thumbnailUrl: string | null
  isActive: boolean
  isPublic: boolean
  isPremium: boolean
  sortOrder: number
  config: TemplateConfig | null
  createdAt: string
  updatedAt: string
}

export type TemplateLayout =
  | 'PROFILE_CARD'
  | 'BANNER'
  | 'BROCHURE'
  | 'PRESENTATION_SLIDE'
  | 'SOCIAL_MEDIA'
  | 'PRINT_READY'

export interface TemplateConfig {
  id: string
  canvasWidth: number
  canvasHeight: number
  imagePosition: { x: number; y: number; width: number; height: number; borderRadius?: number }
  textZones: TextZone[]
  backgroundStyle: string
  backgroundColor: string | null
  backgroundGradient: any | null
  lightingStyle: string
  primaryFont: string
  secondaryFont: string
  accentColor: string
  secondaryColor: string
  showLogo: boolean
  outputFormats: string[]
  outputDpi: number
}

export interface TextZone {
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

export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Generation {
  id: string
  userId: string
  doctorId: string
  templateId: string
  status: GenerationStatus
  selectedImages: string[]
  customizations: any | null
  hospitalThemeId: string | null
  outputUrls: Record<string, string> | null
  outputMetadata: any | null
  errorMessage: string | null
  processingTime: number | null
  doctor?: Pick<Doctor, 'id' | 'name' | 'specialization'>
  template?: Pick<Template, 'id' | 'name' | 'layout' | 'thumbnailUrl'>
  createdAt: string
  updatedAt: string
}

export interface HospitalTheme {
  id: string
  name: string
  hospitalName: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string | null
  fontFamily: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
