'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutDashboard, LogOut, Moon, Plus, Settings, Sun, Target, Weight } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { toggle } = useTheme()

  if (!session) return null

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/measurements', label: 'Log', icon: Weight },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="no-print border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="app-nav-container">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Activity className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
              <img src="/logo.png" alt="" className="h-7 w-7" />
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>Mezurilo</h1>
            </Link>
            <div className="flex gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: isActive ? 'var(--color-surface-2)' : 'transparent',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    }}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/measurements/new" className="btn btn-primary flex items-center gap-1 text-sm">
              <Plus size={16} /> Log
            </Link>
            <button type="button" onClick={toggle} className="btn btn-secondary" aria-label="Toggle theme">
              <Sun size={16} className="hidden dark:inline" />
              <Moon size={16} className="dark:hidden" />
            </button>
            <span className="text-sm hidden sm:inline" style={{ color: 'var(--color-muted)' }}>
              {session.user.name}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn btn-secondary flex items-center gap-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
