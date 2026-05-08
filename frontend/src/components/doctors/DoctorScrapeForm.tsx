'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link2, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { scraperApi, doctorsApi } from '@/lib/api'

const schema = z.object({
  url: z.string().url('Please enter a valid URL (include https://)'),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSuccess: (doctorId: string) => void
}

interface ScrapedData {
  name?: string
  specialization?: string
  hospital?: string
  bio?: string
  imageUrl?: string
  experience?: number
}

export function DoctorScrapeForm({ onSuccess }: Props) {
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped] = useState<ScrapedData | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onExtract = async (data: FormData) => {
    setError('')
    setScraping(true)
    setScraped(null)
    try {
      const res = await scraperApi.extract(data.url)
      setScraped(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extract data from this URL. Try another URL or use manual entry.')
    } finally {
      setScraping(false)
    }
  }

  const onCreateDoctor = async () => {
    if (!scraped) return
    setCreating(true)
    try {
      const docData = {
        name: scraped.name || 'Unknown Doctor',
        specialization: scraped.specialization || 'General Medicine',
        hospital: scraped.hospital,
        bio: scraped.bio,
        experience: scraped.experience,
        inputMethod: 'URL_SCRAPE',
      }
      const res = await doctorsApi.create(docData)
      onSuccess(res.data.id)
    } catch (err: any) {
      setError('Failed to create doctor from scraped data.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-medical-dark mb-1">Extract from Profile URL</h3>
        <p className="text-sm text-medical-muted">
          Paste a hospital website, LinkedIn profile, or medical directory URL. The system will automatically extract doctor details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onExtract)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Profile URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-muted" />
              <Input
                className="pl-10"
                placeholder="https://hospital.com/doctors/dr-smith or LinkedIn URL"
                {...register('url')}
              />
            </div>
            <Button type="submit" loading={scraping} disabled={scraping}>
              {scraping ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url.message}</p>}
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {scraping && (
        <div className="flex items-center justify-center py-12 bg-brand-50 rounded-xl border border-brand-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
            <p className="text-brand-700 font-medium text-sm">Extracting doctor information...</p>
            <p className="text-brand-400 text-xs mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {scraped && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Successfully extracted doctor data</span>
          </div>

          <div className="bg-medical-light rounded-xl border border-medical-border p-5">
            <div className="flex gap-4">
              {scraped.imageUrl && (
                <img
                  src={scraped.imageUrl}
                  alt="Doctor"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="flex-1 space-y-2">
                {scraped.name && (
                  <div>
                    <span className="text-xs font-semibold text-medical-muted uppercase tracking-wider">Name</span>
                    <p className="text-sm font-medium text-medical-dark">{scraped.name}</p>
                  </div>
                )}
                {scraped.specialization && (
                  <div>
                    <span className="text-xs font-semibold text-medical-muted uppercase tracking-wider">Specialization</span>
                    <p className="text-sm text-medical-dark">{scraped.specialization}</p>
                  </div>
                )}
                {scraped.hospital && (
                  <div>
                    <span className="text-xs font-semibold text-medical-muted uppercase tracking-wider">Hospital</span>
                    <p className="text-sm text-medical-dark">{scraped.hospital}</p>
                  </div>
                )}
                {scraped.bio && (
                  <div>
                    <span className="text-xs font-semibold text-medical-muted uppercase tracking-wider">Bio</span>
                    <p className="text-xs text-medical-muted line-clamp-3">{scraped.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-medical-muted">
            Review the extracted data above. You can edit all fields after creating the profile.
          </p>

          <div className="flex justify-end">
            <Button onClick={onCreateDoctor} loading={creating} size="lg">
              Create Doctor Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
