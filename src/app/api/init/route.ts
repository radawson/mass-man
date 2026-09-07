import { NextResponse } from 'next/server'
import { seedDefaultAdmin } from '@/lib/seed-admin'

export async function POST() {
  try {
    await seedDefaultAdmin()
    return NextResponse.json({ success: true, message: 'Initialization complete' })
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 })
  }
}
