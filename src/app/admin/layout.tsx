import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/session'
import Navbar from '@/components/Navbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { error } = await requireAdmin()
  if (error?.status === 401) redirect('/login')
  if (error) return <><Navbar /><main className="app-page-container"><h1>Administrator access required</h1></main></>
  return <><Navbar />{children}</>
}
