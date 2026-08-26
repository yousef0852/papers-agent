import type { Metadata } from 'next'
import { AuthContent } from '@/components/auth/AuthContent'
import '../auth.css'

export const metadata: Metadata = {
  title: 'Sign in — AI Mind',
  description: 'Sign in to your AI Mind notebook.',
}

export default function LoginPage() {
  return <AuthContent mode="signin" />
}
