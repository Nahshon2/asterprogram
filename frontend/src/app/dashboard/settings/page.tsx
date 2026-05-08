'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: user?.name || '', organization: user?.organization || '' },
  })

  useEffect(() => {
    if (user) reset({ name: user.name || '', organization: user.organization || '' })
  }, [user])

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      await authApi.updateMe(data)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Account Settings</h1>
        <p className="text-medical-muted mt-1">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">Full Name</label>
              <Input {...register('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">Email Address</label>
              <Input value={user?.email || ''} disabled className="bg-medical-light" />
              <p className="mt-1 text-xs text-medical-muted">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">Hospital / Organization</label>
              <Input {...register('organization')} placeholder="City General Hospital" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">Account Role</label>
              <Input value={user?.role || ''} disabled className="bg-medical-light" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                {saved ? '✓ Saved' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Plan & Usage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-medical-muted">Current Plan</span>
            <span className="text-sm font-semibold text-medical-dark">Free Tier</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-medical-muted">Max Doctors</span>
            <span className="text-sm text-medical-dark">Unlimited</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-medical-muted">Generations / month</span>
            <span className="text-sm text-medical-dark">50</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
