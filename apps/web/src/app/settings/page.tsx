import type { Metadata } from 'next'
import { SettingsContent } from '@/components/settings/SettingsContent'
import '../settings.css'

export const metadata: Metadata = {
  title: 'Settings — AI Mind',
  description: 'Manage your AI Mind account, notebook, and preferences.',
}

export default function SettingsPage() {
  return <SettingsContent />
}
