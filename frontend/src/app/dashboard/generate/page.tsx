'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Wand2, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { doctorsApi, templatesApi, generationsApi } from '@/lib/api'
import type { Doctor, Template } from '@/types'

type Step = 'doctor' | 'template' | 'configure' | 'generating' | 'done'

export default function GeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillDoctorId = searchParams.get('doctorId')

  const [step, setStep] = useState<Step>('doctor')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [genStatus, setGenStatus] = useState<string>('')
  const [genOutput, setGenOutput] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      doctorsApi.list({ limit: 50 }),
      templatesApi.list(),
    ]).then(([d, t]) => {
      setDoctors(d.data.doctors)
      setTemplates(t.data)

      if (prefillDoctorId) {
        const found = d.data.doctors.find((dr: Doctor) => dr.id === prefillDoctorId)
        if (found) {
          setSelectedDoctor(found)
          setStep('template')
        }
      }
    }).finally(() => setLoading(false))
  }, [prefillDoctorId])

  // Poll generation status
  useEffect(() => {
    if (!generationId || step !== 'generating') return

    const interval = setInterval(async () => {
      try {
        const res = await generationsApi.status(generationId)
        const { status, outputUrls, errorMessage } = res.data

        setGenStatus(status)

        if (status === 'COMPLETED') {
          setGenOutput(outputUrls)
          setStep('done')
          clearInterval(interval)
        } else if (status === 'FAILED') {
          setError(errorMessage || 'Generation failed')
          setStep('configure')
          clearInterval(interval)
        }
      } catch {}
    }, 2000)

    return () => clearInterval(interval)
  }, [generationId, step])

  const generate = async () => {
    if (!selectedDoctor || !selectedTemplate) return
    setError('')
    setStep('generating')
    setGenStatus('PROCESSING')

    try {
      const res = await generationsApi.create({
        doctorId: selectedDoctor.id,
        templateId: selectedTemplate.id,
      })
      setGenerationId(res.data.generationId)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start generation')
      setStep('configure')
    }
  }

  const layoutColors: Record<string, string> = {
    PROFILE_CARD: 'bg-blue-100 text-blue-800',
    BANNER: 'bg-purple-100 text-purple-800',
    BROCHURE: 'bg-green-100 text-green-800',
    PRESENTATION_SLIDE: 'bg-orange-100 text-orange-800',
    SOCIAL_MEDIA: 'bg-pink-100 text-pink-800',
    PRINT_READY: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Generate Doctor Visual</h1>
        <p className="text-medical-muted mt-1">Select a doctor and template to create branded visuals</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { id: 'doctor', label: '1. Select Doctor' },
          { id: 'template', label: '2. Choose Template' },
          { id: 'configure', label: '3. Generate' },
        ].map((s, i) => {
          const steps = ['doctor', 'template', 'configure', 'generating', 'done']
          const current = steps.indexOf(step)
          const sIdx = steps.indexOf(s.id)
          const isActive = s.id === step
          const isDone = current > sIdx

          return (
            <div key={s.id} className="flex items-center">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                  isActive ? 'bg-brand-600 text-white' :
                  isDone ? 'bg-green-100 text-green-700' :
                  'bg-medical-light text-medical-muted'
                }`}
              >
                {isDone ? '✓ ' : ''}{s.label}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-medical-muted mx-1" />}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Select Doctor */}
      {step === 'doctor' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-medical-dark">Select a Doctor</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-medical-light rounded-xl animate-pulse" />)}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 bg-medical-light rounded-xl">
              <p className="text-medical-muted mb-4">No doctors added yet.</p>
              <Button onClick={() => router.push('/dashboard/doctors/new')}>Add First Doctor</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {doctors.map((d) => {
                const primaryImage = d.images?.find((i) => i.isPrimary) || d.images?.[0]
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDoctor(d); setStep('template') }}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-medical-border hover:border-brand-500 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {primaryImage ? (
                        <img src={primaryImage.thumbnailUrl || primaryImage.url} alt={d.name} className="w-12 h-12 object-cover" />
                      ) : (
                        <span className="text-brand-600 font-bold">{d.name[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-medical-dark text-sm truncate">{d.name}</p>
                      <p className="text-xs text-brand-600 truncate">{d.specialization}</p>
                      {d.hospital && <p className="text-xs text-medical-muted truncate">{d.hospital}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Template */}
      {step === 'template' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-medical-dark">Choose Template</h2>
            <button onClick={() => setStep('doctor')} className="text-sm text-brand-600 hover:underline">
              ← Change Doctor
            </button>
          </div>

          {selectedDoctor && (
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
              <div className="w-8 h-8 rounded-lg bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm">
                {selectedDoctor.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-brand-900">{selectedDoctor.name}</p>
                <p className="text-xs text-brand-600">{selectedDoctor.specialization}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t); setStep('configure') }}
                className="text-left p-4 bg-white rounded-xl border-2 border-medical-border hover:border-brand-500 hover:shadow-sm transition-all"
              >
                {t.previewUrl ? (
                  <img src={t.previewUrl} alt={t.name} className="w-full h-24 object-cover rounded-lg mb-3" />
                ) : (
                  <div className="w-full h-24 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 mb-3 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-brand-400" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-medical-dark text-sm">{t.name}</p>
                    {t.description && <p className="text-xs text-medical-muted mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                  {t.isPremium && <Badge variant="premium" className="flex-shrink-0">Pro</Badge>}
                </div>
                <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${layoutColors[t.layout] || 'bg-gray-100 text-gray-700'}`}>
                  {t.layout.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Configure & Generate */}
      {step === 'configure' && selectedDoctor && selectedTemplate && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-medical-dark">Ready to Generate</h2>
            <button onClick={() => setStep('template')} className="text-sm text-brand-600 hover:underline">
              ← Change Template
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Doctor</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium text-medical-dark">{selectedDoctor.name}</p>
                <p className="text-sm text-brand-600">{selectedDoctor.specialization}</p>
                {selectedDoctor.hospital && <p className="text-sm text-medical-muted">{selectedDoctor.hospital}</p>}
                <p className="text-xs text-medical-muted mt-2">
                  {selectedDoctor.images?.length || 0} photo(s) available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Template</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium text-medical-dark">{selectedTemplate.name}</p>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${layoutColors[selectedTemplate.layout] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedTemplate.layout.replace('_', ' ')}
                </span>
                {selectedTemplate.description && (
                  <p className="text-xs text-medical-muted mt-1">{selectedTemplate.description}</p>
                )}
                <p className="text-xs text-medical-muted">
                  Output: {selectedTemplate.config?.outputFormats?.join(', ') || 'PNG'} @ {selectedTemplate.config?.outputDpi || 300} DPI
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-brand-50 rounded-xl border border-brand-100 p-5">
            <h3 className="text-sm font-semibold text-brand-900 mb-3">Identity Preservation Active</h3>
            <ul className="space-y-2">
              {['Doctor face shape & features locked', 'Skin tone and complexion preserved', 'Age-accurate rendering guaranteed', 'No generic or altered face generation'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-brand-700">
                  <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={generate} size="lg" className="px-8">
              <Wand2 className="w-5 h-5 mr-2" /> Generate Visual
            </Button>
          </div>
        </div>
      )}

      {/* Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-medical-border">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-medical-dark mb-2">Generating Visual</h2>
          <p className="text-medical-muted text-sm mb-6">
            Processing identity-preserved doctor image with template...
          </p>
          <div className="w-64 bg-medical-light rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-brand-500 rounded-full animate-pulse w-2/3" />
          </div>
          <p className="text-xs text-medical-muted mt-4">This typically takes 10-30 seconds</p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && genOutput && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-medical-dark">Generation Complete!</h2>
              <p className="text-medical-muted text-sm">Your doctor visual is ready to download</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-medical-border p-6 space-y-4">
            <h3 className="font-semibold text-medical-dark">Download Outputs</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(genOutput).map(([fmt, url]) => (
                <a
                  key={fmt}
                  href={url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                >
                  Download {fmt.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep('doctor')
                setSelectedDoctor(null)
                setSelectedTemplate(null)
                setGenerationId(null)
                setGenOutput(null)
              }}
            >
              Generate Another
            </Button>
            <Button onClick={() => router.push('/dashboard/generations')}>
              View All Generations
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
