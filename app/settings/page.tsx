// app/settings/page.tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Fetch the exact settings defined in your User model
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      theme: true,
      pushNotifications: true,
      emailNotifications: true,
      showInventory: true,
      showBalance: true,
      showActivity: true,
      publicProfile: true,
    },
  })

  if (!user) redirect('/login')

  return <SettingsClient initialSettings={user} />
}