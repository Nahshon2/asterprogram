'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Trash2, Eye, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { generationsApi } from '@/lib/api'
import { formatDateTime, statusVariant } from '@/lib/utils'
import type { Generation } from '@/types'

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<string>('all')
  const limit = 10

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await generationsApi.list({
        page,
        limit,
        ...(filter !== 'all' && { status: filter }),
      })
      setGenerations(res.data.generations)
      setTotal(res.data.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [page, filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this generation?')) return
    await generationsApi.delete(id)
    fetch()
  }

  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'FAILED', label: 'Failed' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-medical-dark">Generation History</h1>
          <p className="text-medical-muted mt-1">{total} total generations</p>
        </div>
        <Link href="/dashboard/generate">
          <Button><Wand2 className="w-4 h-4 mr-2" /> New Generation</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-medical-border text-medical-muted hover:text-brand-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-medical-light rounded-xl animate-pulse" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-24">
          <Wand2 className="w-12 h-12 text-medical-muted mx-auto mb-4 opacity-50" />
          <p className="text-medical-muted">No generations found</p>
          <Link href="/dashboard/generate" className="mt-4 inline-block">
            <Button>Generate First Visual</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {generations.map((gen) => (
            <Card key={gen.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-6 h-6 text-brand-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-medical-dark truncate">
                        {gen.doctor?.name || 'Unknown Doctor'}
                      </p>
                      <span className={statusVariant(gen.status)}>
                        {gen.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-medical-muted">
                      {gen.template?.name} · {formatDateTime(gen.createdAt)}
                      {gen.processingTime && ` · ${(gen.processingTime / 1000).toFixed(1)}s`}
                    </p>
                    {gen.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{gen.errorMessage}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {gen.status === 'COMPLETED' && gen.outputUrls && (
                      <>
                        {Object.entries(gen.outputUrls).map(([fmt, url]) => (
                          <a
                            key={fmt}
                            href={url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="w-3.5 h-3.5 mr-1" />
                              {fmt.toUpperCase()}
                            </Button>
                          </a>
                        ))}
                      </>
                    )}
                    <Link href={`/dashboard/generations/${gen.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(gen.id)}
                      className="text-medical-muted hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-medical-muted px-4">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
