'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wand2, Trash2, Star, X, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DoctorManualForm } from '@/components/doctors/DoctorManualForm'
import { doctorsApi, uploadApi } from '@/lib/api'
import { formatDate, statusVariant } from '@/lib/utils'
import type { Doctor } from '@/types'

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const fetchDoctor = async () => {
    const res = await doctorsApi.get(id)
    setDoctor(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchDoctor() }, [id])

  const onDrop = useCallback(async (files: File[]) => {
    if (!doctor) return
    setUploading(true)
    try {
      await uploadApi.uploadImages(doctor.id, files)
      fetchDoctor()
    } finally {
      setUploading(false)
    }
  }, [doctor])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 5,
    maxSize: 20 * 1024 * 1024,
  })

  const setPrimary = async (imageId: string) => {
    await doctorsApi.setPrimaryImage(doctor!.id, imageId)
    fetchDoctor()
  }

  const deleteImage = async (imageId: string) => {
    await doctorsApi.deleteImage(doctor!.id, imageId)
    fetchDoctor()
  }

  const deleteDoctor = async () => {
    if (!confirm('Delete this doctor and all associated generations?')) return
    await doctorsApi.delete(id)
    router.push('/dashboard/doctors')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!doctor) return <div>Doctor not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/doctors" className="inline-flex items-center gap-2 text-sm text-medical-muted hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/generate?doctorId=${doctor.id}`}>
            <Button>
              <Wand2 className="w-4 h-4 mr-2" /> Generate Visual
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
          <Button variant="ghost" onClick={deleteDoctor} className="text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Doctor header */}
      <div className="flex items-center gap-6 bg-white rounded-xl border border-medical-border p-6">
        <div className="w-20 h-20 rounded-xl bg-brand-100 overflow-hidden flex-shrink-0">
          {doctor.images?.find((i) => i.isPrimary) ? (
            <img
              src={doctor.images.find((i) => i.isPrimary)!.url}
              alt={doctor.name}
              className="w-20 h-20 object-cover"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center text-brand-400 text-3xl font-bold">
              {doctor.name[0]}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-medical-dark">
            {doctor.title ? `${doctor.title} ` : ''}{doctor.name}
          </h1>
          <p className="text-brand-600 font-medium">{doctor.specialization}</p>
          {doctor.hospital && <p className="text-medical-muted text-sm">{doctor.hospital}</p>}
          <div className="flex gap-2 mt-2">
            {doctor.experience && (
              <Badge variant="secondary">{doctor.experience}+ Years Exp.</Badge>
            )}
            <Badge variant="outline">{doctor.inputMethod.replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {editMode ? (
            <Card>
              <CardHeader><CardTitle>Edit Doctor Profile</CardTitle></CardHeader>
              <CardContent>
                <DoctorManualForm
                  initialData={doctor}
                  onSuccess={async (updatedId) => {
                    setEditMode(false)
                    fetchDoctor()
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Doctor Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Full Name', value: doctor.name },
                  { label: 'Specialization', value: doctor.specialization },
                  { label: 'Sub-Specialization', value: doctor.subSpecialization },
                  { label: 'Hospital', value: doctor.hospital },
                  { label: 'Department', value: doctor.department },
                  { label: 'Experience', value: doctor.experience ? `${doctor.experience} years` : null },
                  { label: 'Phone', value: doctor.phone },
                  { label: 'Email', value: doctor.email },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label} className="flex gap-4">
                    <span className="text-sm font-medium text-medical-muted w-40 flex-shrink-0">{f.label}</span>
                    <span className="text-sm text-medical-dark">{f.value}</span>
                  </div>
                ))}
                {doctor.bio && (
                  <div>
                    <span className="text-sm font-medium text-medical-muted block mb-2">Biography</span>
                    <p className="text-sm text-medical-dark leading-relaxed">{doctor.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Photos ({doctor.images?.length || 0}/10)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-medical-border hover:border-brand-300'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-6 h-6 text-medical-muted mx-auto mb-2" />
                <p className="text-sm text-medical-muted">
                  {uploading ? 'Uploading...' : 'Drop photos or click to upload'}
                </p>
              </div>

              {doctor.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {doctor.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.thumbnailUrl || img.url}
                        alt="Doctor photo"
                        className={`w-full h-28 object-cover rounded-lg border-2 transition-colors ${img.isPrimary ? 'border-brand-500' : 'border-medical-border'}`}
                      />
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> Primary
                        </span>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <button
                            onClick={() => setPrimary(img.id)}
                            className="w-6 h-6 bg-brand-600 text-white rounded flex items-center justify-center text-xs"
                            title="Set as primary"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteImage(img.id)}
                          className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {doctor.identityProfile && (
            <Card>
              <CardHeader><CardTitle>Identity Profile</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-medical-muted">Consistency Score</span>
                  <span className="font-semibold text-green-600">
                    {((doctor.identityProfile.consistencyScore || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-medical-light rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(doctor.identityProfile.consistencyScore || 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-medical-muted">
                  Identity locked from primary image. All generations preserve facial features.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Recent Generations</CardTitle></CardHeader>
            <CardContent>
              {doctor.generations?.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-medical-muted">No generations yet</p>
                  <Link href={`/dashboard/generate?doctorId=${doctor.id}`}>
                    <Button size="sm" className="mt-3">Generate Visual</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctor.generations?.slice(0, 5).map((gen) => (
                    <Link key={gen.id} href={`/dashboard/generations/${gen.id}`}>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-medical-light transition-colors">
                        <div>
                          <p className="text-xs font-medium text-medical-dark">{gen.template?.name}</p>
                          <p className="text-xs text-medical-muted">{formatDate(gen.createdAt)}</p>
                        </div>
                        <span className={statusVariant(gen.status)}>{gen.status.toLowerCase()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
