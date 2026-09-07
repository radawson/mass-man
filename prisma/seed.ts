import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const url = new URL(databaseUrl)
const schema = url.searchParams.get('schema') || 'public'
const isRemote = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1'

const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port || '5432', 10),
  database: url.pathname.slice(1).split('?')[0],
  user: url.username ? decodeURIComponent(url.username) : undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  options: `-c search_path=${schema}`,
})

const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) })

async function main() {
  await prisma.$connect()
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (existing) {
    console.log('Admin already exists:', existing.email)
    return
  }

  const password = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!', 10)
  const admin = await prisma.user.create({
    data: {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@massman.local',
      name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
      password,
      role: 'ADMIN',
    },
  })
  console.log('Created admin:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
