import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@/generated/prisma/client'

export async function seedDefaultAdmin() {
  const adminExists = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  })

  if (adminExists) {
    console.log('Admin user already exists')
    return
  }

  const defaultAdmin = {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@massman.local',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
    name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
  }

  const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10)

  await prisma.user.create({
    data: {
      email: defaultAdmin.email,
      name: defaultAdmin.name,
      password: hashedPassword,
      role: Role.ADMIN,
      isKeycloakUser: false,
      isActive: true,
    },
  })

  console.log('Default admin created:', defaultAdmin.email)
}
