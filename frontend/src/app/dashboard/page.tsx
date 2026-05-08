'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Stethoscope, Wand2, History, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { doctorsApi, generationsApi } from '@/lib/api'
import { formatDateTime, statusVariant } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Doctor, Generation } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      doctorsApi.list({ limit: 5 }),
      generationsApi.list({ limit: 5 }),
    ]).then(([d, g]) => {
      setDoctors(d.data.doctors)
      setGenerations(g.data.generations)
    }).finally(() => setLoading(false))
  }, [])

  const totalDoctors = doctors.length
  const completedGens = generations.filter((g) => g.status === 'COMPLETED').length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">
          Good morning, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-medical-muted mt-1">
          {user?.organization || 'Your hospital branding dashboard'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/doctors/new">
          <div className="group bg-brand-600 hover:bg-brand-700 rounded-xl p-6 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center mb-4">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Add Doctor</h3>
            <p className="text-brand-200 text-sm">
              Manual form, upload photos, or paste a URL
            </p>
            <div className="mt-4 flex items-center gap-1 text-brand-200 text-sm group-hover:text-white transition-colors">
              Get started <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/generate">
          <div className="group bg-white hover:bg-brand-50 rounded-xl border border-medical-border p-6 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
              <Wand2 className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-semibold text-medical-dark mb-1">Generate Visual</h3>
            <p className="text-medical-muted text-sm">
              Select a doctor and template, generate instantly
            </p>
            <div className="mt-4 flex items-center gap-1 text-brand-600 text-sm">
              Generate now <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/generations">
          <div className="group bg-white hover:bg-brand-50 rounded-xl border border-medical-border p-6 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
              <History className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-semibold text-medical-dark mb-1">View History</h3>
            <p className="text-medical-muted text-sm">
              Download and manage previous outputs
            </p>
            <div className="mt-4 flex items-center gap-1 text-brand-600 text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Doctors', value: totalDoctors, icon: Stethoscope, color: 'text-brand-600' },
          { label: 'Generated', value: completedGens, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Processing', value: generations.filter((g) => g.status === 'PROCESSING').length, icon: Clock, color: 'text-yellow-600' },
          { label: 'Failed', value: generations.filter((g) => g.status === 'FAILED').length, icon: AlertCircle, color: 'text-red-600' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-medical-dark">{stat.value}</p>
                    <p className="text-xs text-medical-muted mt-1">{stat.label}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Doctors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Doctors</CardTitle>
            <Link href="/dashboard/doctors">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-medical-light rounded-lg animate-pulse" />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-10 h-10 text-medical-muted mx-auto mb-3 opacity-50" />
                <p className="text-medical-muted text-sm">No doctors yet</p>
                <Link href="/dashboard/doctors/new">
                  <Button size="sm" className="mt-3">Add First Doctor</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <Link key={doctor.id} href={`/dashboard/doctors/${doctor.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-medical-light transition-colors">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {doctor.images?.[0] ? (
                          <img src={doctor.images[0].thumbnailUrl || doctor.images[0].url} alt={doctor.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <Stethoscope className="w-5 h-5 text-brand-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-medical-dark text-sm truncate">{doctor.name}</p>
                        <p className="text-medical-muted text-xs truncate">{doctor.specialization}</p>
                      </div>
                      <span className="text-xs text-medical-muted flex-shrink-0">
                        {doctor._count?.generations || 0} gen
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Generations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Generations</CardTitle>
            <Link href="/dashboard/generations">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-medical-light rounded-lg animate-pulse" />
                ))}
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-8">
                <Wand2 className="w-10 h-10 text-medical-muted mx-auto mb-3 opacity-50" />
                <p className="text-medical-muted text-sm">No generations yet</p>
                <Link href="/dashboard/generate">
                  <Button size="sm" className="mt-3">Generate First Visual</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {generations.map((gen) => (
                  <Link key={gen.id} href={`/dashboard/generations/${gen.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-medical-light transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-medical-dark text-sm truncate">
                          {gen.doctor?.name || 'Unknown Doctor'}
                        </p>
                        <p className="text-medical-muted text-xs">
                          {gen.template?.name} · {formatDateTime(gen.createdAt)}
                        </p>
                      </div>
                      <span className={statusVariant(gen.status)}>
                        {gen.status.toLowerCase()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
