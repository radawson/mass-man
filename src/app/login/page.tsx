'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LogIn, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hasKeycloak, setHasKeycloak] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((res) => res.json())
      .then((providers) => setHasKeycloak(Boolean(providers?.keycloak)))
      .catch(() => undefined)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Login successful')
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>Mass Man</h1>
          <h2 className="mt-4 text-center text-2xl font-semibold">Sign in</h2>
        </div>
        <div className="card space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              Email
              <input
                className="input mt-1"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                className="input mt-1"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
              />
            </label>
            <button type="submit" className="w-full btn btn-primary flex items-center justify-center gap-2" disabled={isLoading}>
              <LogIn size={18} />
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {hasKeycloak && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-muted)' }}>Or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signIn('keycloak', { callbackUrl: '/dashboard' })}
                className="w-full btn btn-secondary flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                Sign in with SSO
              </button>
            </>
          )}
          <div className="text-center text-sm">
            <Link href="/register" style={{ color: 'var(--color-accent)' }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
