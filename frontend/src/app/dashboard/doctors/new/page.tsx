'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Link2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DoctorManualForm } from '@/components/doctors/DoctorManualForm'
import { DoctorUploadForm } from '@/components/doctors/DoctorUploadForm'
import { DoctorScrapeForm } from '@/components/doctors/DoctorScrapeForm'

type Tab = 'manual' | 'upload' | 'scrape'

const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
  {
    id: 'manual',
    label: 'Manual Entry',
    icon: FileText,
    desc: 'Fill in doctor details by hand',
  },
  {
    id: 'upload',
    label: 'Upload Photos',
    icon: Upload,
    desc: 'Create profile from doctor photos',
  },
  {
    id: 'scrape',
    label: 'Profile URL',
    icon: Link2,
    desc: 'Auto-extract from a web page',
  },
]

export default function NewDoctorPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('manual')

  const onSuccess = (doctorId: string) => {
    router.push(`/dashboard/doctors/${doctorId}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/dashboard/doctors" className="inline-flex items-center gap-2 text-sm text-medical-muted hover:text-brand-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Doctors
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Add Doctor</h1>
        <p className="text-medical-muted mt-1">Choose how you want to add doctor information</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                activeTab === tab.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-medical-border bg-white text-medical-muted hover:border-brand-300 hover:text-brand-600'
              )}
            >
              <Icon className="w-6 h-6" />
              <div>
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{tab.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Form content */}
      <div className="bg-white rounded-xl border border-medical-border p-6">
        {activeTab === 'manual' && <DoctorManualForm onSuccess={onSuccess} />}
        {activeTab === 'upload' && <DoctorUploadForm onSuccess={onSuccess} />}
        {activeTab === 'scrape' && <DoctorScrapeForm onSuccess={onSuccess} />}
      </div>
    </div>
  )
}
