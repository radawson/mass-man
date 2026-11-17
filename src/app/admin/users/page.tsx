'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean; isKeycloakUser: boolean }

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [status, setStatus] = useState('Loading…')
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users').then(async (res) => {
      if (!res.ok) throw new Error('Could not load users')
      setUsers(await res.json())
      setStatus('')
    }).catch(() => setStatus('Could not load users'))
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), email: data.get('email'), password: data.get('password') || undefined }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not create user')
      toast.success('User created')
      router.push(`/admin/users/${result.id}`)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not create user') }
    finally { setSaving(false) }
  }

  const visible = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(filter.toLowerCase()))
  return (
    <main className="app-page-container space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <form onSubmit={create} className="card space-y-4">
        <h2 className="text-xl font-semibold">Add a person</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <label>Name<input className="input" name="name" required minLength={2} maxLength={200} autoComplete="off" /></label>
          <label>Email<input className="input" name="email" type="email" required autoComplete="off" /></label>
          <label>Password (optional)<input className="input" name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" /></label>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>You can log measurements immediately. Leave the password blank for SSO-only access. A verified Keycloak login with the same email will keep this profile and its history.</p>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create user'}</button>
      </form>
      <label className="block">Find a person<input className="input max-w-md" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
      {status && <p role="status">{status}</p>}
      <div className="table-wrap"><table className="w-full text-sm">
        <thead><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Account</th><th className="p-3">Manage</th></tr></thead>
        <tbody>{visible.map((user) => <tr key={user.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <td className="p-3">{user.name}</td><td className="p-3">{user.email}</td><td className="p-3">{user.isKeycloakUser ? 'SSO' : 'Local'} · {user.role}{!user.isActive && ' · Inactive'}</td>
          <td className="p-3"><Link className="btn btn-secondary" href={`/admin/users/${user.id}`}>Profile & measurements</Link></td>
        </tr>)}</tbody>
      </table></div>
      {!status && visible.length === 0 && <p>No matching users.</p>}
    </main>
  )
}
