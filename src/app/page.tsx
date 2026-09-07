import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <p className="text-sm tracking-[0.3em]" style={{ color: 'var(--color-accent)' }}>MASS MAN</p>
        <h1 className="text-5xl font-bold">Body progress, tracked.</h1>
        <p className="text-lg" style={{ color: 'var(--color-muted)' }}>
          Log weight, device body-fat %, and tape measurements. Daily averages, goals, and trends stay private to your account.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="btn btn-primary">Sign in</Link>
          <Link href="/register" className="btn btn-secondary">Create account</Link>
        </div>
      </div>
    </main>
  )
}
