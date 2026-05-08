'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { doctorsApi, uploadApi } from '@/lib/api'
import { formatFileSize } from '@/lib/utils'

interface Props {
  onSuccess: (doctorId: string) => void
}

export function DoctorUploadForm({ onSuccess }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [hospital, setHospital] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<string>('')

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => {
      const all = [...prev, ...accepted]
      return all.slice(0, 10)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
  })

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!name || !specialization) {
      setError('Name and specialization are required.')
      return
    }
    if (files.length === 0) {
      setError('Please upload at least one doctor photo.')
      return
    }

    setError('')
    setSubmitting(true)
    setProgress('Creating doctor profile...')

    try {
      const doctorRes = await doctorsApi.create({
        name,
        specialization,
        hospital,
        inputMethod: 'UPLOAD',
      })
      const doctorId = doctorRes.data.id

      setProgress(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`)
      await uploadApi.uploadImages(doctorId, files)

      setProgress('Done!')
      onSuccess(doctorId)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
      setProgress('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-medical-dark mb-1">Create from Doctor Photos</h3>
        <p className="text-sm text-medical-muted">
          Upload high-quality doctor photos. The system will build an identity profile from the primary image.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">
            Doctor Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Sarah Johnson"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">
            Specialization <span className="text-red-500">*</span>
          </label>
          <Input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Neurology"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-medical-dark mb-1.5">Hospital</label>
        <Input
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
          placeholder="City Medical Center"
        />
      </div>

      {/* Dropzone */}
      <div>
        <label className="block text-sm font-medium text-medical-dark mb-1.5">
          Doctor Photos <span className="text-red-500">*</span>
          <span className="text-medical-muted font-normal ml-1">(up to 10 photos, max 20MB each)</span>
        </label>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-medical-border hover:border-brand-300 hover:bg-brand-50/30'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-medical-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-medical-dark">
            {isDragActive ? 'Drop photos here...' : 'Drag & drop doctor photos here'}
          </p>
          <p className="text-xs text-medical-muted mt-1">or click to browse — JPEG, PNG, WebP</p>
        </div>
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file)
            return (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-medical-border"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                    Primary
                  </span>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-medical-muted mt-1 truncate">{formatFileSize(file.size)}</p>
              </div>
            )
          })}
          {files.length < 10 && (
            <div
              {...getRootProps()}
              className="h-24 rounded-lg border-2 border-dashed border-medical-border flex items-center justify-center cursor-pointer hover:border-brand-300 transition-colors"
            >
              <input {...getInputProps()} />
              <Plus className="w-6 h-6 text-medical-muted" />
            </div>
          )}
        </div>
      )}

      {progress && (
        <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg border border-brand-100">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-brand-700">{progress}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} loading={submitting} size="lg" disabled={files.length === 0 || !name || !specialization}>
          Create Doctor Profile
        </Button>
      </div>
    </div>
  )
}
