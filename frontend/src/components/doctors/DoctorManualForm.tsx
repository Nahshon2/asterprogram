'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { doctorsApi } from '@/lib/api'

const schema = z.object({
  title: z.string().optional(),
  name: z.string().min(2, 'Name required'),
  specialization: z.string().min(2, 'Specialization required'),
  subSpecialization: z.string().optional(),
  experience: z.coerce.number().int().min(0).max(80).optional(),
  hospital: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSuccess: (doctorId: string) => void
  initialData?: Partial<FormData>
}

const field = (label: string, error?: string, children?: React.ReactNode) => (
  <div>
    <label className="block text-sm font-medium text-medical-dark mb-1.5">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
)

export function DoctorManualForm({ onSuccess, initialData }: Props) {
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await doctorsApi.create({ ...data, inputMethod: 'MANUAL' })
      onSuccess(res.data.id)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create doctor profile')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Title</label>
          <Input placeholder="Dr." {...register('title')} />
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-medical-dark mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input placeholder="John Smith" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">
            Specialization <span className="text-red-500">*</span>
          </label>
          <Input placeholder="Cardiology" {...register('specialization')} />
          {errors.specialization && <p className="mt-1 text-xs text-red-600">{errors.specialization.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Sub-Specialization</label>
          <Input placeholder="Interventional Cardiology" {...register('subSpecialization')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Hospital / Clinic</label>
          <Input placeholder="City General Hospital" {...register('hospital')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Department</label>
          <Input placeholder="Department of Cardiology" {...register('department')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Years of Experience</label>
          <Input type="number" placeholder="15" min={0} max={80} {...register('experience')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Phone</label>
          <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Email</label>
          <Input type="email" placeholder="doctor@hospital.com" {...register('email')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-dark mb-1.5">Website</label>
          <Input placeholder="https://hospital.com/dr-smith" {...register('website')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-medical-dark mb-1.5">Biography</label>
        <Textarea
          rows={4}
          placeholder="Dr. Smith is a board-certified cardiologist with over 15 years of experience..."
          {...register('bio')}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" loading={isSubmitting}>
          Create Doctor Profile
        </Button>
      </div>
    </form>
  )
}
