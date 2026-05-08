'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await login(data.email, data.password)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">DocIdentity</p>
            <p className="text-brand-300 text-xs">Generator Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-medical-dark">Welcome back</h1>
            <p className="text-medical-muted mt-1 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">
                Email address
              </label>
              <Input
                type="email"
                placeholder="doctor@hospital.com"
                {...register('email')}
                className={errors.email ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-medical-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-muted hover:text-medical-text"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-medical-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-600 font-medium hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-brand-50 rounded-lg border border-brand-100">
            <p className="text-xs text-brand-700 font-medium mb-2">Demo Credentials</p>
            <p className="text-xs text-brand-600">User: demo@hospital.com / Demo@123!</p>
            <p className="text-xs text-brand-600">Admin: admin@docidentity.com / Admin@123!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
