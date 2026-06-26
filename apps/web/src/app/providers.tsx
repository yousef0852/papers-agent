'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'
import { LocaleProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return <LocaleProvider>{children}</LocaleProvider>
}
