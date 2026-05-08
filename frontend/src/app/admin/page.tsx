'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Stethoscope, Wand2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'
import { formatDateTime, statusVariant } from '@/lib/utils'

interface Stats {
  users: number
  doctors: number
  generations: number
  pendingGenerations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentGenerations, setRecentGenerations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats().then((res) => {
      setStats(res.data.stats)
      setRecentGenerations(res.data.recentGenerations)
    }).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Doctors', value: stats.doctors, icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Generations', value: stats.generations, icon: Wand2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Processing', value: stats.pendingGenerations, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ] : []

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Admin Dashboard</h1>
        <p className="text-medical-muted mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-medical-light rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-medical-dark">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-medical-muted mt-1">{stat.label}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: Users },
          { href: '/admin/templates', label: 'Templates', icon: Wand2 },
          { href: '/admin/themes', label: 'Hospital Themes', icon: CheckCircle },
          { href: '/admin/settings', label: 'Settings', icon: AlertCircle },
        ].map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-medical-border hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer">
                <Icon className="w-5 h-5 text-brand-600" />
                <span className="text-sm font-medium text-medical-dark">{link.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Generations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Generations</CardTitle>
          <Link href="/admin/generations">
            <button className="text-sm text-brand-600 hover:underline">View all</button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGenerations.map((gen: any) => (
              <div key={gen.id} className="flex items-center gap-4 py-2 border-b border-medical-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-dark truncate">
                    {gen.doctor?.name} — {gen.template?.name}
                  </p>
                  <p className="text-xs text-medical-muted">
                    {gen.user?.name || gen.user?.email} · {formatDateTime(gen.createdAt)}
                  </p>
                </div>
                <span className={statusVariant(gen.status)}>{gen.status.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
