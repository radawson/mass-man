import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
  pool: Pool
}

const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

let poolConfig: {
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  connectionString?: string
  ssl: boolean | { rejectUnauthorized: boolean }
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
  options?: string
}

try {
  const url = new URL(databaseUrl)
  const dbName = url.pathname.slice(1).split('?')[0]
  const password = url.password ? decodeURIComponent(url.password) : undefined
  const schema = url.searchParams.get('schema') || 'public'

  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: dbName,
    user: url.username ? decodeURIComponent(url.username) : undefined,
    password,
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === 'false'
      ? (process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false)
      : (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1'
          ? { rejectUnauthorized: false }
          : false),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    options: `-c search_path=${schema}`,
  }
} catch {
  const isRemote = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')
  poolConfig = {
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' || (process.env.DATABASE_SSL !== 'false' && isRemote)
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

const pool = globalForPrisma.pool || new Pool(poolConfig)

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool
}

const adapter = new PrismaPg(pool, {
  schema: (() => {
    try {
      return new URL(databaseUrl).searchParams.get('schema') || 'public'
    } catch {
      return 'public'
    }
  })(),
})

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
