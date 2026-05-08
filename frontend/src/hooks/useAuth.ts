'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { AuthUser, getStoredUser, getStoredToken, setAuth, clearAuth } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

import { createContext as _createContext } from 'react'
export const AuthContext = _createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = getStoredUser()
    const token = getStoredToken()
    if (stored && token) {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { token, user: u } = res.data
    setAuth(token, u)
    setUser(u)
    router.push('/dashboard')
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    setUser(null)
    router.push('/login')
  }

  const refresh = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
    } catch {
      clearAuth()
      setUser(null)
    }
  }

  return { user, loading, login, logout, refresh }
}
