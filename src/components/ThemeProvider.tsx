'use client'

import { useSession } from 'next-auth/react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM'

function applyTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'DARK' || (theme === 'SYSTEM' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

const ThemeContext = createContext<{
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => Promise<void>
  toggle: () => void
}>({
  theme: 'SYSTEM',
  setTheme: async () => undefined,
  toggle: () => undefined,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [theme, setThemeState] = useState<ThemePreference>('SYSTEM')

  useEffect(() => {
    const stored = window.localStorage.getItem('mass-man-theme') as ThemePreference | null
    if (stored === 'LIGHT' || stored === 'DARK' || stored === 'SYSTEM') {
      setThemeState(stored)
      applyTheme(stored)
    } else {
      applyTheme('SYSTEM')
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.theme) return
        setThemeState(data.theme)
        window.localStorage.setItem('mass-man-theme', data.theme)
        applyTheme(data.theme)
      })
      .catch(() => undefined)
  }, [status])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(theme)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback(async (next: ThemePreference) => {
    setThemeState(next)
    window.localStorage.setItem('mass-man-theme', next)
    applyTheme(next)
    if (status === 'authenticated') {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      })
    }
  }, [status])

  const toggle = useCallback(() => {
    const next = document.documentElement.classList.contains('dark') ? 'LIGHT' : 'DARK'
    void setTheme(next)
  }, [setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
