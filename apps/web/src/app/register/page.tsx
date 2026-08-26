import type { Metadata } from 'next'
import { AuthContent } from '@/components/auth/AuthContent'
import '../auth.css'

export const metadata: Metadata = {
  title: 'Create account — AI Mind',
  description: 'Create your AI Mind notebook account.',
}

export default function RegisterPage() {
  return <AuthContent mode="signup" />
}
