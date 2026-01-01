import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function ensureUser(name: string, email: string, role: 'ADMIN' | 'EMPLOYEE', password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({ data: { name, email, password: hashed, role, isActive: true } })
    console.log('User dibuat:', email)
  } else {
    console.log('User sudah ada:', email)
  }
}

async function main() {
  await ensureUser(
    process.env.ADMIN_NAME || 'Admin',
    process.env.ADMIN_EMAIL || 'admin@example.com',
    'ADMIN',
    process.env.ADMIN_PASSWORD || 'password'
  )

  const employees = [
    { name: 'Employee 1', email: 'employee1@example.com', password: 'password' },
    { name: 'Employee 2', email: 'employee2@example.com', password: 'password' },
    { name: 'Employee 3', email: 'employee3@example.com', password: 'password' },
  ]

  for (const e of employees) {
    await ensureUser(e.name, e.email, 'EMPLOYEE', e.password)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

