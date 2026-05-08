'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'

interface Setting {
  id: string
  key: string
  value: string
  type: string
}

const settingLabels: Record<string, string> = {
  max_uploads_per_doctor: 'Max Photos per Doctor',
  max_generations_per_month: 'Max Generations per Month (per user)',
  ai_provider: 'AI Provider',
  enable_scraping: 'Enable Web Scraping',
  watermark_enabled: 'Enable Watermark on Free Tier',
  maintenance_mode: 'Maintenance Mode',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    adminApi.settings().then((res) => {
      setSettings(res.data)
      const defaults: Record<string, string> = {}
      res.data.forEach((s: Setting) => { defaults[s.key] = s.value })
      setEditing(defaults)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (key: string) => {
    await adminApi.updateSetting(key, editing[key])
    setSaved((prev) => [...prev, key])
    setTimeout(() => setSaved((prev) => prev.filter((k) => k !== key)), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">System Settings</h1>
        <p className="text-medical-muted mt-1">Configure platform-wide settings</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-medical-light rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-medical-border p-0">
            {settings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-medical-dark">
                    {settingLabels[setting.key] || setting.key}
                  </p>
                  <p className="text-xs text-medical-muted mt-0.5 font-mono">{setting.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  {setting.type === 'boolean' ? (
                    <select
                      value={editing[setting.key] || setting.value}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      className="text-sm border border-medical-border rounded-lg px-3 py-1.5 bg-white"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <Input
                      value={editing[setting.key] ?? setting.value}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      className="w-40 text-sm"
                    />
                  )}
                  <Button
                    size="sm"
                    variant={saved.includes(setting.key) ? 'secondary' : 'default'}
                    onClick={() => handleSave(setting.key)}
                  >
                    {saved.includes(setting.key) ? '✓ Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
