'use client'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  organization: string | null
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}
