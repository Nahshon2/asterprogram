import { PrismaClient, Role, TemplateLayout } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create super admin
  const adminPassword = await bcrypt.hash('Admin@123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@docidentity.com' },
    update: {},
    create: {
      email: 'admin@docidentity.com',
      name: 'System Admin',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
      organization: 'Doctor Identity Generator',
    },
  })
  console.log('Admin created:', admin.email)

  // Create demo user
  const userPassword = await bcrypt.hash('Demo@123!', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@hospital.com' },
    update: {},
    create: {
      email: 'demo@hospital.com',
      name: 'Demo Hospital',
      password: userPassword,
      role: Role.USER,
      emailVerified: true,
      organization: 'City General Hospital',
    },
  })
  console.log('Demo user created:', demoUser.email)

  // Create hospital theme
  const theme = await prisma.hospitalTheme.upsert({
    where: { id: 'default-medical-blue' },
    update: {},
    create: {
      id: 'default-medical-blue',
      name: 'Medical Premium Blue',
      primaryColor: '#1E3A8A',
      secondaryColor: '#BFDBFE',
      accentColor: '#2563EB',
      fontFamily: 'Inter',
      isDefault: true,
    },
  })

  // Create templates
  const templates = [
    {
      id: 'profile-card-standard',
      name: 'Professional Profile Card',
      description: 'Clean, corporate medical profile card with photo and credentials',
      layout: TemplateLayout.PROFILE_CARD,
      category: 'hospital',
      isActive: true,
      isPublic: true,
      isPremium: false,
      sortOrder: 1,
      config: {
        canvasWidth: 800,
        canvasHeight: 600,
        imagePosition: { x: 40, y: 60, width: 280, height: 340, borderRadius: 12 },
        textZones: [
          { id: 'name', x: 360, y: 80, width: 400, height: 60, align: 'left', font: 'Inter', size: 28, color: '#1E3A8A', field: 'name', weight: 'bold' },
          { id: 'title', x: 360, y: 148, width: 400, height: 30, align: 'left', font: 'Inter', size: 16, color: '#6B7280', field: 'title', weight: 'normal' },
          { id: 'specialization', x: 360, y: 188, width: 400, height: 30, align: 'left', font: 'Inter', size: 18, color: '#2563EB', field: 'specialization', weight: 'semibold' },
          { id: 'hospital', x: 360, y: 228, width: 400, height: 25, align: 'left', font: 'Inter', size: 15, color: '#374151', field: 'hospital', weight: 'normal' },
          { id: 'experience', x: 360, y: 280, width: 200, height: 60, align: 'center', font: 'Inter', size: 14, color: '#374151', field: 'experience', weight: 'normal' },
          { id: 'bio', x: 360, y: 350, width: 400, height: 150, align: 'left', font: 'Inter', size: 13, color: '#6B7280', field: 'bio', weight: 'normal' }
        ],
        backgroundStyle: 'medical_premium',
        backgroundColor: '#F8FAFC',
        lightingStyle: 'soft_studio',
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        accentColor: '#1E40AF',
        secondaryColor: '#BFDBFE',
        showLogo: true,
        outputFormats: ['png', 'jpg'],
        outputDpi: 300,
      },
    },
    {
      id: 'banner-hospital-wide',
      name: 'Hospital Website Banner',
      description: 'Wide banner format for hospital websites and landing pages',
      layout: TemplateLayout.BANNER,
      category: 'hospital',
      isActive: true,
      isPublic: true,
      isPremium: false,
      sortOrder: 2,
      config: {
        canvasWidth: 1400,
        canvasHeight: 500,
        imagePosition: { x: 900, y: 40, width: 420, height: 420, borderRadius: 8 },
        textZones: [
          { id: 'name', x: 80, y: 100, width: 750, height: 70, align: 'left', font: 'Inter', size: 42, color: '#FFFFFF', field: 'name', weight: 'bold' },
          { id: 'title_spec', x: 80, y: 180, width: 700, height: 40, align: 'left', font: 'Inter', size: 22, color: '#BFDBFE', field: 'specialization', weight: 'semibold' },
          { id: 'hospital', x: 80, y: 230, width: 700, height: 30, align: 'left', font: 'Inter', size: 16, color: '#E5E7EB', field: 'hospital', weight: 'normal' },
          { id: 'experience', x: 80, y: 290, width: 300, height: 50, align: 'left', font: 'Inter', size: 14, color: '#D1D5DB', field: 'experience', weight: 'normal' },
          { id: 'contact', x: 80, y: 380, width: 500, height: 40, align: 'left', font: 'Inter', size: 15, color: '#BFDBFE', field: 'phone', weight: 'normal' }
        ],
        backgroundStyle: 'navy',
        backgroundColor: '#1E3A8A',
        backgroundGradient: { from: '#1E3A8A', to: '#1E40AF', direction: 'horizontal' },
        lightingStyle: 'corporate_glow',
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        accentColor: '#60A5FA',
        secondaryColor: '#BFDBFE',
        showLogo: true,
        outputFormats: ['png', 'jpg'],
        outputDpi: 150,
      },
    },
    {
      id: 'brochure-tri-fold',
      name: 'Medical Brochure Panel',
      description: 'Premium brochure panel for printed materials and PDFs',
      layout: TemplateLayout.BROCHURE,
      category: 'clinic',
      isActive: true,
      isPublic: true,
      isPremium: true,
      sortOrder: 3,
      config: {
        canvasWidth: 595,
        canvasHeight: 842,
        imagePosition: { x: 80, y: 80, width: 435, height: 350, borderRadius: 4 },
        textZones: [
          { id: 'name', x: 80, y: 450, width: 435, height: 50, align: 'center', font: 'Inter', size: 26, color: '#1E3A8A', field: 'name', weight: 'bold' },
          { id: 'specialization', x: 80, y: 508, width: 435, height: 30, align: 'center', font: 'Inter', size: 16, color: '#2563EB', field: 'specialization', weight: 'semibold' },
          { id: 'hospital', x: 80, y: 545, width: 435, height: 25, align: 'center', font: 'Inter', size: 14, color: '#6B7280', field: 'hospital', weight: 'normal' },
          { id: 'bio', x: 80, y: 590, width: 435, height: 160, align: 'left', font: 'Inter', size: 12, color: '#374151', field: 'bio', weight: 'normal' },
          { id: 'contact', x: 80, y: 770, width: 435, height: 40, align: 'center', font: 'Inter', size: 13, color: '#1E3A8A', field: 'phone', weight: 'normal' }
        ],
        backgroundStyle: 'white_studio',
        backgroundColor: '#FFFFFF',
        lightingStyle: 'natural',
        primaryFont: 'Inter',
        secondaryFont: 'Georgia',
        accentColor: '#1E40AF',
        secondaryColor: '#EFF6FF',
        showLogo: true,
        outputFormats: ['png', 'pdf'],
        outputDpi: 300,
      },
    },
    {
      id: 'presentation-slide',
      name: 'Presentation Slide',
      description: 'Widescreen slide format for medical presentations',
      layout: TemplateLayout.PRESENTATION_SLIDE,
      category: 'hospital',
      isActive: true,
      isPublic: true,
      isPremium: false,
      sortOrder: 4,
      config: {
        canvasWidth: 1920,
        canvasHeight: 1080,
        imagePosition: { x: 1200, y: 100, width: 600, height: 700, borderRadius: 300 },
        textZones: [
          { id: 'name', x: 100, y: 200, width: 900, height: 80, align: 'left', font: 'Inter', size: 56, color: '#FFFFFF', field: 'name', weight: 'bold' },
          { id: 'specialization', x: 100, y: 300, width: 900, height: 50, align: 'left', font: 'Inter', size: 30, color: '#93C5FD', field: 'specialization', weight: 'semibold' },
          { id: 'hospital', x: 100, y: 380, width: 900, height: 40, align: 'left', font: 'Inter', size: 22, color: '#E5E7EB', field: 'hospital', weight: 'normal' },
          { id: 'bio', x: 100, y: 460, width: 900, height: 200, align: 'left', font: 'Inter', size: 18, color: '#D1D5DB', field: 'bio', weight: 'normal' },
          { id: 'experience', x: 100, y: 700, width: 400, height: 80, align: 'left', font: 'Inter', size: 16, color: '#93C5FD', field: 'experience', weight: 'normal' }
        ],
        backgroundStyle: 'navy',
        backgroundColor: '#0F172A',
        backgroundGradient: { from: '#0F172A', to: '#1E3A8A', direction: 'diagonal' },
        lightingStyle: 'corporate_glow',
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        accentColor: '#3B82F6',
        secondaryColor: '#93C5FD',
        showLogo: true,
        outputFormats: ['png'],
        outputDpi: 150,
      },
    },
    {
      id: 'social-media-square',
      name: 'Social Media Post',
      description: 'Square format for LinkedIn, Instagram medical posts',
      layout: TemplateLayout.SOCIAL_MEDIA,
      category: 'social',
      isActive: true,
      isPublic: true,
      isPremium: false,
      sortOrder: 5,
      config: {
        canvasWidth: 1080,
        canvasHeight: 1080,
        imagePosition: { x: 140, y: 100, width: 800, height: 600, borderRadius: 16 },
        textZones: [
          { id: 'name', x: 80, y: 740, width: 920, height: 60, align: 'center', font: 'Inter', size: 36, color: '#1E3A8A', field: 'name', weight: 'bold' },
          { id: 'specialization', x: 80, y: 810, width: 920, height: 40, align: 'center', font: 'Inter', size: 22, color: '#2563EB', field: 'specialization', weight: 'semibold' },
          { id: 'hospital', x: 80, y: 860, width: 920, height: 30, align: 'center', font: 'Inter', size: 16, color: '#6B7280', field: 'hospital', weight: 'normal' },
          { id: 'experience', x: 80, y: 910, width: 920, height: 30, align: 'center', font: 'Inter', size: 14, color: '#9CA3AF', field: 'experience', weight: 'normal' }
        ],
        backgroundStyle: 'white_studio',
        backgroundColor: '#F8FAFC',
        lightingStyle: 'soft_studio',
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        accentColor: '#1E40AF',
        secondaryColor: '#DBEAFE',
        showLogo: false,
        outputFormats: ['jpg', 'png'],
        outputDpi: 72,
      },
    },
  ]

  for (const t of templates) {
    const { config, ...templateData } = t
    const template = await prisma.template.upsert({
      where: { id: t.id },
      update: {},
      create: {
        ...templateData,
        config: {
          create: config,
        },
      },
    })
    console.log('Template seeded:', template.name)
  }

  // System settings
  const settings = [
    { key: 'max_uploads_per_doctor', value: '10', type: 'number' },
    { key: 'max_generations_per_month', value: '50', type: 'number' },
    { key: 'ai_provider', value: 'replicate', type: 'string' },
    { key: 'enable_scraping', value: 'true', type: 'boolean' },
    { key: 'watermark_enabled', value: 'false', type: 'boolean' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean' },
  ]

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
