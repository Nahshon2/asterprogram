'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generationsApi } from '@/lib/api'
import { formatDateTime, statusVariant } from '@/lib/utils'
import type { Generation } from '@/types'

export default function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gen, setGen] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  const fetchGen = async () => {
    const res = await generationsApi.get(id)
    setGen(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchGen() }, [id])

  // Poll if processing
  useEffect(() => {
    if (!gen || gen.status !== 'PROCESSING') return
    setPolling(true)
    const interval = setInterval(async () => {
      const res = await generationsApi.get(id)
      setGen(res.data)
      if (res.data.status !== 'PROCESSING') {
        setPolling(false)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [gen?.status])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!gen) return <div>Generation not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/dashboard/generations" className="inline-flex items-center gap-2 text-sm text-medical-muted hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-medical-dark">Generation Result</h1>
          <p className="text-medical-muted mt-1">{formatDateTime(gen.createdAt)}</p>
        </div>
        <span className={statusVariant(gen.status)}>{gen.status.toLowerCase()}</span>
      </div>

      {gen.status === 'PROCESSING' && (
        <div className="flex items-center justify-center py-12 bg-brand-50 rounded-xl border border-brand-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
            <p className="text-brand-700 font-medium">Processing generation...</p>
            <p className="text-brand-400 text-sm mt-1">Auto-refreshing every 3 seconds</p>
          </div>
        </div>
      )}

      {gen.status === 'FAILED' && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800 mb-1">Generation Failed</p>
          <p className="text-sm text-red-700">{gen.errorMessage || 'Unknown error occurred'}</p>
        </div>
      )}

      {gen.status === 'COMPLETED' && gen.outputUrls && (
        <Card>
          <CardHeader><CardTitle>Download Outputs</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(gen.outputUrls).map(([fmt, url]) => (
                <a key={fmt} href={url} download target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Download {fmt.toUpperCase()}
                  </Button>
                </a>
              ))}
            </div>
            {gen.processingTime && (
              <p className="text-xs text-medical-muted mt-3">
                Generated in {(gen.processingTime / 1000).toFixed(1)} seconds
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Doctor</CardTitle></CardHeader>
          <CardContent>
            {gen.doctor && (
              <>
                <p className="font-medium text-medical-dark">{gen.doctor.name}</p>
                <p className="text-sm text-brand-600">{gen.doctor.specialization}</p>
                <Link href={`/dashboard/doctors/${gen.doctor.id}`}>
                  <Button variant="ghost" size="sm" className="mt-2 -ml-2">View Doctor →</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Template</CardTitle></CardHeader>
          <CardContent>
            {gen.template && (
              <>
                <p className="font-medium text-medical-dark">{gen.template.name}</p>
                <p className="text-sm text-medical-muted capitalize">{gen.template.layout.replace('_', ' ').toLowerCase()}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href={`/dashboard/generate?doctorId=${gen.doctorId}&templateId=${gen.templateId}`}>
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" /> Regenerate
          </Button>
        </Link>
        <Link href="/dashboard/generate">
          <Button>New Generation</Button>
        </Link>
      </div>
    </div>
  )
}
