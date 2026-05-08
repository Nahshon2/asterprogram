import Link from 'next/link'
import { Stethoscope, Shield, Wand2, Download, ArrowRight, CheckCircle, Star } from 'lucide-react'

const features = [
  {
    icon: Wand2,
    title: 'AI-Powered Generation',
    description: 'Generate professional doctor visuals in seconds using advanced AI with full identity preservation.',
  },
  {
    icon: Shield,
    title: 'Identity Preservation',
    description: 'The same real doctor — exact face, skin tone, features — in every template. No generic avatars.',
  },
  {
    icon: Download,
    title: 'Multi-Format Output',
    description: 'Export as PNG, JPG, PDF, or print-ready files at 300 DPI for any use case.',
  },
]

const templates = [
  { name: 'Profile Card', desc: 'Corporate medical profile for websites' },
  { name: 'Hospital Banner', desc: 'Wide banner for landing pages' },
  { name: 'Medical Brochure', desc: 'A4 print-ready PDF panel' },
  { name: 'Presentation Slide', desc: '16:9 slide for medical decks' },
  { name: 'Social Media Post', desc: 'LinkedIn & Instagram square format' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-medical-border z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-brand-900">DocIdentity</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-medical-text hover:text-brand-600 transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-800 text-brand-200 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-brand-700">
            <Star className="w-3.5 h-3.5 fill-brand-300 text-brand-300" />
            Hospital Branding Automation Engine
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Professional Doctor Visuals,{' '}
            <span className="text-brand-300">Identity Preserved</span>
          </h1>
          <p className="text-lg text-brand-200 max-w-3xl mx-auto mb-10 leading-relaxed">
            Upload doctor photos, paste a profile URL, or fill in details — and instantly generate
            premium, branded doctor profile images for hospitals and clinics. Same face, every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white text-brand-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-50 transition-colors text-base shadow-lg"
            >
              Start Generating Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-800 transition-colors text-base"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-medical-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-medical-dark mb-4">
              Everything hospitals need for doctor branding
            </h2>
            <p className="text-medical-muted max-w-2xl mx-auto">
              From manual input to URL scraping — three ways to add doctors, five template formats, one consistent identity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-medical-border p-8 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-medical-dark mb-3">{f.title}</h3>
                  <p className="text-medical-muted leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Input methods */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-medical-dark mb-6">
                Three ways to add doctor data
              </h2>
              <div className="space-y-6">
                {[
                  { num: '01', title: 'Manual Form', desc: 'Fill in doctor name, specialization, hospital, bio, and contact details.' },
                  { num: '02', title: 'Upload Photos', desc: 'Upload up to 10 high-quality doctor photos. Identity is locked from the primary image.' },
                  { num: '03', title: 'Paste Profile URL', desc: 'Paste a hospital website, LinkedIn, or directory URL. System auto-extracts all details.' },
                ].map((item) => (
                  <div key={item.num} className="flex gap-5">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {item.num}
                    </div>
                    <div>
                      <h3 className="font-semibold text-medical-dark mb-1">{item.title}</h3>
                      <p className="text-medical-muted text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-950 to-brand-800 rounded-2xl p-8 text-white">
              <h3 className="text-lg font-semibold mb-6 text-brand-200">Available Templates</h3>
              <div className="space-y-4">
                {templates.map((t) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-300 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white text-sm">{t.name}</p>
                      <p className="text-brand-300 text-xs">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to automate your hospital&apos;s doctor branding?
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            Join hospitals and clinics generating professional doctor visuals in minutes, not days.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-50 transition-colors text-base shadow-lg"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-brand-950 text-brand-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            <span className="font-semibold text-white">DocIdentity Generator</span>
          </div>
          <p>© 2025 DocIdentity. Hospital Branding Automation Platform.</p>
        </div>
      </footer>
    </div>
  )
}
