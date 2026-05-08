'use client'

import { useEffect, useState } from 'react'
import { Plus, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    hospitalName: '',
    primaryColor: '#1E3A8A',
    secondaryColor: '#BFDBFE',
    accentColor: '#2563EB',
    fontFamily: 'Inter',
  })
  const [saving, setSaving] = useState(false)

  const fetchThemes = async () => {
    const res = await adminApi.themes()
    setThemes(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchThemes() }, [])

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      await adminApi.createTheme(form)
      setShowForm(false)
      setForm({ name: '', hospitalName: '', primaryColor: '#1E3A8A', secondaryColor: '#BFDBFE', accentColor: '#2563EB', fontFamily: 'Inter' })
      fetchThemes()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-medical-dark">Hospital Themes</h1>
          <p className="text-medical-muted mt-1">Define branding themes for different hospitals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> New Theme
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Hospital Theme</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-medical-dark mb-1.5">Theme Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Premium Blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-medical-dark mb-1.5">Hospital Name</label>
                <Input
                  value={form.hospitalName}
                  onChange={(e) => setForm((p) => ({ ...p, hospitalName: e.target.value }))}
                  placeholder="City General Hospital"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['primaryColor', 'secondaryColor', 'accentColor'].map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-medical-dark mb-1.5 capitalize">
                    {key.replace('Color', ' Color')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={(form as any)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-10 h-9 border border-medical-border rounded cursor-pointer"
                    />
                    <Input
                      value={(form as any)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} loading={saving}>Create Theme</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-medical-light rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <Card key={theme.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-medical-dark text-sm truncate">{theme.name}</p>
                    {theme.hospitalName && (
                      <p className="text-xs text-medical-muted truncate">{theme.hospitalName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Primary', color: theme.primaryColor },
                    { label: 'Secondary', color: theme.secondaryColor },
                    { label: 'Accent', color: theme.accentColor },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-medical-muted">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                        <span className="font-mono text-medical-dark">{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
