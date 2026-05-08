'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileImage, Wand2, History,
  Settings, Shield, LogOut, Stethoscope, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/lib/auth'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/doctors',     label: 'Doctors',      icon: Stethoscope },
  { href: '/dashboard/templates',   label: 'Templates',    icon: FileImage },
  { href: '/dashboard/generate',    label: 'Generate',     icon: Wand2 },
  { href: '/dashboard/generations', label: 'History',      icon: History },
  { href: '/dashboard/settings',    label: 'Settings',     icon: Settings },
]

const adminItems = [
  { href: '/admin',                 label: 'Admin Panel',  icon: Shield },
  { href: '/admin/users',           label: 'Users',        icon: Users },
  { href: '/admin/templates',       label: 'Templates',    icon: FileImage },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 h-screen bg-white border-r border-medical-border flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-medical-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-900 leading-none">DocIdentity</p>
            <p className="text-xs text-medical-muted mt-0.5">Generator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-item', active && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isAdmin(user) && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-medical-muted uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('sidebar-item', active && 'active')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-medical-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-medical-light transition-colors">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {user ? getInitials(user.name || user.email) : '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-medical-dark truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-medical-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-medical-muted transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
