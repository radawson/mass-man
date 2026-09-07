'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Registration failed')
        return
      }
      toast.success('Account created. Please sign in.')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>Mass Man</h1>
          <h2 className="mt-4 text-center text-2xl font-semibold">Create your account</h2>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              Name
              <input className="input mt-1" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={isLoading} />
            </label>
            <label className="block text-sm">
              Email
              <input className="input mt-1" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isLoading} />
            </label>
            <label className="block text-sm">
              Password
              <input className="input mt-1" type="password" required minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} disabled={isLoading} />
            </label>
            <label className="block text-sm">
              Confirm password
              <input className="input mt-1" type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} disabled={isLoading} />
            </label>
            <button type="submit" className="w-full btn btn-primary flex items-center justify-center gap-2" disabled={isLoading}>
              <UserPlus size={18} />
              {isLoading ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link href="/login" style={{ color: 'var(--color-accent)' }}>Already have an account?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
