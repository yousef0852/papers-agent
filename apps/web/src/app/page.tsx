import type { Metadata } from 'next'
import { LandingContent } from '@/components/landing/LandingContent'
import './landing.css'

export const metadata: Metadata = {
  title: 'AI Mind — The History of Artificial Intelligence, mapped as you learn it',
  description:
    'Chat with a scholarly AI tutor. Every concept grows your personal timeline — a notebook that becomes more valuable with every session.',
}

export default function LandingPage() {
  return <LandingContent />
}
