'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    const res = await adminApi.users({ page, search })
    setUsers(res.data.users)
    setTotal(res.data.pagination.total)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page, search])

  const toggleActive = async (id: string, isActive: boolean) => {
    await adminApi.updateUser(id, { isActive: !isActive })
    fetchUsers()
  }

  const updateRole = async (id: string, role: string) => {
    await adminApi.updateUser(id, { role })
    fetchUsers()
  }

  const roleVariant: Record<string, any> = {
    USER: 'secondary',
    ADMIN: 'default',
    SUPER_ADMIN: 'premium',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-medical-dark">Users</h1>
        <p className="text-medical-muted mt-1">{total} registered users</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-muted" />
        <Input
          className="pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-medical-light rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-medical-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">Activity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-medical-light/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-medical-dark">{user.name || '—'}</p>
                        <p className="text-xs text-medical-muted">{user.email}</p>
                        {user.organization && (
                          <p className="text-xs text-medical-muted">{user.organization}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={roleVariant[user.role] || 'secondary'}>{user.role}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-medical-muted">
                        {user._count?.doctors || 0} doctors · {user._count?.generations || 0} gen
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-medical-muted">{formatDate(user.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          className="text-xs border border-medical-border rounded px-2 py-1 bg-white"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                        <Button
                          variant={user.isActive ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => toggleActive(user.id, user.isActive)}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
