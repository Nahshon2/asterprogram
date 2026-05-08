'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wand2, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { templatesApi } from '@/lib/api'
import type { Template } from '@/types'

const layoutColors: Record<string, string> = {
  PROFILE_CARD: 'bg-blue-100 text-blue-800',
  BANNER: 'bg-purple-100 text-purple-800',
  BROCHURE: 'bg-green-100 text-green-800',
  PRESENTATION_SLIDE: 'bg-orange-100 text-orange-800',
  SOCIAL_MEDIA: 'bg-pink-100 text-pink-800',
  PRINT_READY: 'bg-gray-100 text-gray-800',
}

const layoutFilters = ['All', 'PROFILE_CARD', 'BANNER', 'BROCHURE', 'PRESENTATION_SLIDE', 'SOCIAL_MEDIA']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    templatesApi.list().then((res) => {
      setTemplates(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? templates : templates.filter((t) => t.layout === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Templates</h1>
        <p className="text-medical-muted mt-1">
          {templates.length} professionally designed doctor visual templates
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {layoutFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-medical-border text-medical-muted hover:text-brand-600 hover:border-brand-300'
            }`}
          >
            {f === 'All' ? 'All Templates' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 bg-medical-light rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              {/* Preview */}
              <div className="h-40 bg-gradient-to-br from-brand-900 to-brand-700 relative overflow-hidden">
                {template.previewUrl ? (
                  <img
                    src={template.previewUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LayoutTemplate className="w-12 h-12 text-brand-300 opacity-50" />
                  </div>
                )}
                {template.isPremium && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="premium">Pro</Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-medical-dark">{template.name}</h3>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${layoutColors[template.layout] || 'bg-gray-100 text-gray-700'}`}>
                    {template.layout.replace('_', ' ')}
                  </span>
                </div>

                {template.description && (
                  <p className="text-sm text-medical-muted mb-4 line-clamp-2">{template.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-medical-muted mb-4">
                  <span>
                    {template.config?.canvasWidth}×{template.config?.canvasHeight}px
                  </span>
                  <span>
                    {template.config?.outputFormats?.join(', ').toUpperCase()} · {template.config?.outputDpi} DPI
                  </span>
                </div>

                <Link href={`/dashboard/generate?templateId=${template.id}`}>
                  <Button className="w-full" size="sm">
                    <Wand2 className="w-4 h-4 mr-2" /> Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
