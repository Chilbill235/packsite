// app/settings/SettingsClient.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateUserSettings } from '@/app/actions'

type UserSettings = {
  theme: string | null
  pushNotifications: boolean
  emailNotifications: boolean
  showInventory: boolean
  showBalance: boolean
  showActivity: boolean
  publicProfile: boolean
}

export default function SettingsClient({ initialSettings }: { initialSettings: UserSettings }) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (key: keyof UserSettings) => {
    if (typeof settings[key] !== 'boolean') return
    const newValue = !settings[key]

    // 1. Optimistically update local state so the UI reflects it instantly
    setSettings((prev) => ({ ...prev, [key]: newValue }))

    // 2. Sync change with the database in the background
    startTransition(async () => {
      try {
        await updateUserSettings({ [key]: newValue })
      } catch (error) {
        // Rollback state if server action fails
        setSettings((prev) => ({ ...prev, [key]: !newValue }))
        console.error('Failed to update setting:', error)
      }
    })
  }

  const handleThemeChange = (theme: string) => {
    setSettings((prev) => ({ ...prev, theme }))
    startTransition(async () => {
      try {
        await updateUserSettings({ theme })
      } catch (error) {
        setSettings((prev) => ({ ...prev, theme: initialSettings.theme }))
        console.error('Failed to update theme:', error)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings & Preferences</h1>

      {/* Notifications Section */}
      <div className="space-y-4 bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold">Notifications</h2>
        
        <label className="flex items-center justify-between cursor-pointer">
          <span>Push Notifications</span>
          <input
            type="checkbox"
            checked={settings.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span>Email Notifications</span>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>
      </div>

      {/* Privacy & Visibility Section */}
      <div className="space-y-4 bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold">Privacy & Display</h2>

        <label className="flex items-center justify-between cursor-pointer">
          <span>Show Inventory Publicly</span>
          <input
            type="checkbox"
            checked={settings.showInventory}
            onChange={() => handleToggle('showInventory')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span>Show Balance</span>
          <input
            type="checkbox"
            checked={settings.showBalance}
            onChange={() => handleToggle('showBalance')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span>Show Activity Log</span>
          <input
            type="checkbox"
            checked={settings.showActivity}
            onChange={() => handleToggle('showActivity')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span>Public Profile</span>
          <input
            type="checkbox"
            checked={settings.publicProfile}
            onChange={() => handleToggle('publicProfile')}
            disabled={isPending}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>
      </div>

      {/* Theme Picker */}
      <div className="space-y-2 bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold">Theme Preference</h2>
        <select
          value={settings.theme ?? 'dark'}
          onChange={(e) => handleThemeChange(e.target.value)}
          disabled={isPending}
          className="w-full p-2 rounded border bg-background"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
    </div>
  )
}