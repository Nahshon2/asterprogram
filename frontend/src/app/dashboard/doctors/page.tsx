'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Stethoscope, Trash2, Edit, Wand2, Link2, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { doctorsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Doctor } from '@/types'

const inputMethodIcon = {
  MANUAL: FileText,
  UPLOAD: Upload,
  URL_SCRAPE: Link2,
}

const inputMethodLabel = {
  MANUAL: 'Manual',
  UPLOAD: 'Upload',
  URL_SCRAPE: 'Scraped',
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const res = await doctorsApi.list({ page, limit, search })
      setDoctors(res.data.doctors)
      setTotal(res.data.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDoctors() }, [page, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor and all associated data?')) return
    await doctorsApi.delete(id)
    fetchDoctors()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-medical-dark">Doctors</h1>
          <p className="text-medical-muted mt-1">{total} doctor{total !== 1 ? 's' : ''} in your library</p>
        </div>
        <Link href="/dashboard/doctors/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Doctor
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-muted" />
        <Input
          className="pl-10 max-w-md"
          placeholder="Search doctors by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-medical-light rounded-xl animate-pulse" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-10 h-10 text-brand-400" />
          </div>
          <h2 className="text-xl font-semibold text-medical-dark mb-2">
            {search ? 'No doctors found' : 'Add your first doctor'}
          </h2>
          <p className="text-medical-muted mb-6 max-w-sm mx-auto">
            {search
              ? 'Try a different search term.'
              : 'Add doctors via manual form, photo upload, or paste a profile URL.'}
          </p>
          {!search && (
            <Link href="/dashboard/doctors/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Doctor
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => {
            const MethodIcon = inputMethodIcon[doctor.inputMethod]
            const primaryImage = doctor.images?.find((i) => i.isPrimary) || doctor.images?.[0]
            return (
              <Card key={doctor.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={primaryImage.thumbnailUrl || primaryImage.url}
                          alt={doctor.name}
                          className="w-16 h-16 object-cover"
                        />
                      ) : (
                        <Stethoscope className="w-8 h-8 text-brand-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-medical-dark text-sm truncate">
                          {doctor.title ? `${doctor.title} ` : ''}{doctor.name}
                        </h3>
                      </div>
                      <p className="text-brand-600 text-xs font-medium truncate">{doctor.specialization}</p>
                      {doctor.hospital && (
                        <p className="text-medical-muted text-xs truncate mt-0.5">{doctor.hospital}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-medical-muted">
                          <MethodIcon className="w-3 h-3" />
                          {inputMethodLabel[doctor.inputMethod]}
                        </span>
                        <span className="text-medical-muted">·</span>
                        <span className="text-xs text-medical-muted">
                          {doctor._count?.generations || 0} generations
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-medical-border">
                    <Link href={`/dashboard/generate?doctorId=${doctor.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Wand2 className="w-3.5 h-3.5 mr-1" /> Generate
                      </Button>
                    </Link>
                    <Link href={`/dashboard/doctors/${doctor.id}`}>
                      <Button variant="outline" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doctor.id)}
                      className="text-medical-muted hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-medical-muted px-4">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
